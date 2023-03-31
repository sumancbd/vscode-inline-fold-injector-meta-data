import { commands, ExtensionContext, Position, window, workspace, WorkspaceConfiguration } from "vscode";
import { Decorator } from "./decorator";
import { DecoratorValue } from "./decoratorValue";
import { Commands, Configs } from "./enums";
import { EventsLimit } from "./utils";
import axios from "axios";
import { InjectorIdType } from "./types";

const loadDataFromApi = async () => {
   const res = await axios.get<{result: Array<InjectorIdType>}>('http://localhost:3000/test/injector-id');
   return res.data.result.map<InjectorIdType>(item => ({
      label: item.title,
      detail: item.injectorId,
      ...item,
   }))
}

export async function activate(context: ExtensionContext) {

   const injectorIds = await loadDataFromApi();

   const config: WorkspaceConfiguration = workspace.getConfiguration(Configs.identifier);
   const decorator = new Decorator();
   const decoratorValue = new DecoratorValue();
   const elimit = new EventsLimit();
   decorator.updateConfigs(config);
   decoratorValue.updateConfigs(config);
   elimit.Register(triggerUpdateDecorations)
   elimit.Lead();

   function triggerUpdateDecorations(): void {
      const textEditor = window.activeTextEditor;
      if (!textEditor) return
      decorator.activeEditor(textEditor);
      decoratorValue.activeEditor(textEditor);
   }

   commands.registerCommand(Commands.inlineInjectorIdFoldToggle, () => {
      decorator.toggle();
      decoratorValue.toggle();
   }, null);
   
   commands.registerCommand(Commands.injectorIdInsert, async () => {
      const selectedId = await window.showQuickPick(injectorIds);

      if (selectedId === undefined) return;

      const injectorIdPart = selectedId.injectorId.split('-');

      let searchQuery = '';
      if (injectorIdPart.length === 2) {
         searchQuery = await window.showInputBox({
            placeHolder: "Enter name",
            prompt: `Enter ${injectorIdPart[1].replace('{', '').replace('}', '')}`
         });

         if (searchQuery === undefined) return;
      }

      const activeTextEditor = window.activeTextEditor;
      const injectorId = injectorIdPart.length === 2 ? `${injectorIdPart[0]}-${searchQuery}` : selectedId?.injectorId;

      const selectePosition = activeTextEditor.selections;
      const prefixText = `/** @injector-start: ${injectorId} */`;
      const safixText = `/** @injector-stop: ${injectorId} */`;

      activeTextEditor.edit(editBuilder => {
         const selectedText0 = activeTextEditor.document.lineAt(selectePosition[0].start.line).text;
         const selectedText1 = activeTextEditor.document.lineAt(selectePosition[0].end.line).text;

         editBuilder.insert(
            new Position(selectePosition[0].start.line, selectedText0.search(/\S/)),
            `${prefixText}\n${selectedText0.substring(0, selectedText0.search(/\S/))}`
         );
         editBuilder.insert(
            new Position(selectePosition[0].end.line, selectedText1.length + selectedText1.search(/\S/)),
            `\n${selectedText1.substring(0, selectedText1.search(/\S/))}${safixText}`
         );
      });

   }, null);

   window.onDidChangeActiveTextEditor((e) => {
      if (!e) return;
      elimit.Tail()
   }, null, context.subscriptions);

   window.onDidChangeTextEditorSelection(
      (e) => {
         // event.kind is undefined when the selection change happens from tab switch
         // good to limit the number of times the decoration is updated, so no need
         // to wrap the event.
         if (!e.kind || !e.textEditor) return
         elimit.Lead()
      }, null, context.subscriptions
   );

   window.onDidChangeTextEditorVisibleRanges((e) => {
      if (!e.textEditor) return
      elimit.Tail()
   }, null, context.subscriptions);

   workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(Configs.identifier)) {
         decorator.updateConfigs(workspace.getConfiguration(Configs.identifier));
         decoratorValue.updateConfigs(workspace.getConfiguration(Configs.identifier));
      }
   }, null, context.subscriptions);

}
