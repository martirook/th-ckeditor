/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Command from "@ckeditor/ckeditor5-core/src/command";
import findAttributeRange from "@ckeditor/ckeditor5-typing/src/utils/findattributerange";
import { getRangeText } from "./utils.js";
import { toMap } from "@ckeditor/ckeditor5-utils";

export default class AbbreviationCommand extends Command {
  refresh() {
    const model = this.editor.model;
    const selection = model.document.selection;
    const firstRange = selection.getFirstRange();

    // When the selection is collapsed, the command has a value if the caret is in an abbreviation.
    if (firstRange.isCollapsed) {
      if (selection.hasAttribute("pillData")) {
        const pillData = selection.getAttribute("pillData");
        const pillDataObj = pillData.split("$$_$$");
        const id = pillDataObj[0];
        const markup = pillDataObj[1];

        // Find the entire range containing the abbreviation under the caret position.
        const pillDataRange = findAttributeRange(
          selection.getFirstPosition(),
          "pillData",
          pillData,
          model
        );

        this.value = {
          id,
          abbr: getRangeText(pillDataRange),
          markup,
          range: pillDataRange,
        };
      } else {
        this.value = null;
      }
    }
    // When the selection is not collapsed, the command has a value if the selection contains a subset of a single abbreviation
    // or an entire abbreviation.
    else {
      if (selection.hasAttribute("pillData")) {
        const pillData = selection.getAttribute("pillData");
        const pillDataObj = pillData.split("$$_$$");
        const id = pillDataObj[0];
        const markup = pillDataObj[1];

        // Find the entire range containing the abbreviation under the caret position.
        const pillDataRange = findAttributeRange(
          selection.getFirstPosition(),
          "pillData",
          pillData,
          model
        );

        if (pillDataRange.containsRange(firstRange, true)) {
          this.value = {
            id,
            abbr: getRangeText(firstRange),
            markup,
            range: firstRange,
          };
        } else {
          this.value = null;
        }
      } else {
        this.value = null;
      }
    }

    // The command is enabled when the "abbreviation" attribute can be set on the current model selection.
    this.isEnabled = model.schema.checkAttributeInSelection(
      selection,
      "pillData"
    );
  }

  execute({ id, abbr, markup }) {
    const model = this.editor.model;
    const selection = model.document.selection;
    const pillData = `${id}$$_$$${markup}`;

    model.change((writer) => {
      // If selection is collapsed then update the selected abbreviation or insert a new one at the place of caret.
      if (selection.isCollapsed) {
        // When a collapsed selection is inside text with the "abbreviation" attribute, update its text and markup.
        if (this.value) {
          const { end: positionAfter } = model.insertContent(
            writer.createText(abbr, { pillData }),
            this.value.range
          );
          // Put the selection at the end of the inserted abbreviation.
          writer.setSelection(positionAfter);
        }
        // If the collapsed selection is not in an existing abbreviation, insert a text node with the "abbreviation" attribute
        // in place of the caret. Because the selection is collapsed, the attribute value will be used as a data for text.
        // If the abbreviation is empty, do not do anything.
        else if (abbr !== "") {
          const firstPosition = selection.getFirstPosition();

          // Collect all attributes of the user selection (could be "bold", "italic", etc.)
          const attributes = toMap(selection.getAttributes());

          // Put the new attribute to the map of attributes.
          attributes.set("pillData", pillData);

          // Inject the new text node with the abbreviation text with all selection attributes.
          const { end: positionAfter } = model.insertContent(
            writer.createText(abbr, attributes),
            firstPosition
          );

          // Put the selection at the end of the inserted abbreviation. Using an end of a range returned from
          // insertContent() just in case nodes with the same attributes were merged.
          writer.setSelection(positionAfter);
        }

        // Remove the "abbreviation" attribute attribute from the selection. It stops adding a new content into the abbreviation
        // if the user starts to type.
        writer.removeSelectionAttribute("pillData");
      } else {
        // If the selection has non-collapsed ranges, change the attribute on nodes inside those ranges
        // omitting nodes where the "abbreviation" attribute is disallowed.
        const ranges = model.schema.getValidRanges(
          selection.getRanges(),
          "pillData"
        );

        for (const range of ranges) {
          writer.setAttribute("pillData", pillData, range);
        }
      }
    });
  }
}
