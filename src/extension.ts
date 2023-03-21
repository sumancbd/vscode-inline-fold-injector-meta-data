import { commands, ExtensionContext, window, workspace, WorkspaceConfiguration } from "vscode";
import { Decorator } from "./decorator";
import { DecoratorValue } from "./decoratorValue";
import { Commands, Configs } from "./enums";
import { EventsLimit } from "./utils";

export function activate(context: ExtensionContext) {
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
