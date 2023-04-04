import { Position, window } from "vscode";
import { InjectorIdType } from "./types";

export const runInjectorIdInsertCommand = async (injectorIds: InjectorIdType[]) => {
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

  const activeTextEditor = window.activeTextEditor;
  const injectorId =
    injectorIdPart.length === 2
      ? `${injectorIdPart[0]}-${searchQuery}`
      : selectedId?.injectorId;

  const selectePosition = activeTextEditor.selections;
  const prefixText = `/** @injector-id: ${injectorId} */`;

  activeTextEditor.edit((editBuilder) => {
    if (selectePosition[0].start.character === selectePosition[0].end.character 
      && selectePosition[0].start.line === selectePosition[0].end.line) {
        editBuilder.insert(
          new Position(selectePosition[0].start.line, selectePosition[0].start.character),
          ` ${prefixText}`
        );
      } else {
        const selectedText0 = activeTextEditor.document.lineAt(
          selectePosition[0].start.line
        ).text;

        editBuilder.insert(
          new Position(selectePosition[0].start.line, selectedText0.search(/\S/)),
          `${prefixText}\n${selectedText0.substring(0, selectedText0.search(/\S/))}`
        );
      }
  });
};
