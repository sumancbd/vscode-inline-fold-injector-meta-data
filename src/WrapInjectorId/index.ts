import { Position, window } from "vscode";
import { InjectorIdType } from "../core/types";

export const runInjectorIdWrapCommand = async (injectorIds: InjectorIdType[]) => {
  const activeTextEditor = window.activeTextEditor;
  const selectePosition = activeTextEditor.selections;

  if (selectePosition[0].start.character === selectePosition[0].end.character 
    && selectePosition[0].start.line === selectePosition[0].end.line) {
      await window.showErrorMessage('Please select text to wrap with injector id.', 'Cancel');
      return;
  }

  const selectedId = await window.showQuickPick(injectorIds);

  if (selectedId === undefined) return;

  const injectorIdPart = selectedId.injectorId.split("-");

  let searchQuery = "";
  if (injectorIdPart.length === 2) {
    searchQuery = await window.showInputBox({
      placeHolder: "Enter name",
      prompt: `Enter ${injectorIdPart[1].replace("{", "").replace("}", "")}`,
    });

    if (searchQuery === undefined) return;
  }

  const injectorId =
    injectorIdPart.length === 2
      ? `${injectorIdPart[0]}-${searchQuery}`
      : selectedId?.injectorId;
  
  const prefixText = `/** @injector-start: ${injectorId} */`;
  const safixText = `/** @injector-stop: ${injectorId} */`;

  activeTextEditor.edit((editBuilder) => {
    const selectedText0 = activeTextEditor.document.lineAt(
      selectePosition[0].start.line
    ).text;
    const selectedText1 = activeTextEditor.document.lineAt(
      selectePosition[0].end.line
    ).text;

    editBuilder.insert(
      new Position(selectePosition[0].start.line, selectedText0.search(/\S/)),
      `${prefixText}\n${selectedText0.substring(0, selectedText0.search(/\S/))}`
    );
    editBuilder.insert(
      new Position(
        selectePosition[0].end.line,
        selectedText1.length + selectedText1.search(/\S/)
      ),
      `\n${selectedText1.substring(0, selectedText1.search(/\S/))}${safixText}`
    );
  });
};
