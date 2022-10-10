/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals console, window, document */

import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import Widget from "@ckeditor/ckeditor5-widget/src/widget";
import UpcastWriter from "@ckeditor/ckeditor5-engine/src/view/upcastwriter";
import { viewToModelPositionOutsideModelElement } from "@ckeditor/ckeditor5-widget/src/utils";
import { uuidv4 } from "../utils";

//
// The draggable pill editor plugin.
//

export default class Draggable extends Plugin {
  static get requires() {
    return [Widget];
  }

  init() {
    this._defineSchema();
    this._defineClipboardInputOutput();

    // View-to-model position mapping is needed because an draggable pill element in the model is represented by a single element,
    // but in the view it is a more complex structure.
    this.editor.editing.mapper.on(
      "viewToModelPosition",
      viewToModelPositionOutsideModelElement(this.editor.model, (viewElement) =>
        viewElement.hasClass("th-pill")
      )
    );
  }

  _defineSchema() {
    this.editor.model.schema.register("draggable-pill", {
      allowWhere: "$text",
      isInline: true,
      isObject: true,
      allowAttributes: ["id", "markup"],
    });
  }

  // Integration with the clipboard pipeline.
  _defineClipboardInputOutput() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;

    // Processing pasted or dropped content.
    this.listenTo(viewDocument, "clipboardInput", (evt, data) => {
      // The clipboard content was already processed by the listener on the higher priority
      // (for example while pasting into the code block).
      const htmlString = data.dataTransfer.getData("htmlJson");
      if (data.content || !htmlString) {
        return;
      }

      const htmlJson = JSON.parse(htmlString);

      const isNestedGroup = htmlJson.child[0].tag === "details";

      // Translate the draggable pill data to a view fragment.
      const writer = new UpcastWriter(viewDocument);
      const fragment = writer.createDocumentFragment();

      if (!isNestedGroup) {
        const markupIsArray = Array.isArray(htmlJson.child[0].attr.markup);
        writer.appendChild(
          writer.createElement(
            "abbr",
            {
              class: "th-pill",
              id: uuidv4(),
              markup: markupIsArray
                ? htmlJson.child[0].attr.markup.join(" ")
                : htmlJson.child[0].attr.markup,
            },
            htmlJson.child[0].child[0].text
          ),
          fragment
        );
      } else {
        writer.appendChild(getNestedList(writer, htmlJson.child[0]), fragment);
      }

      // Provide the content to the clipboard pipeline for further processing.
      data.content = fragment;
    });
  }
}

//
// draggable pill helper functions.
//

function createListElement(writer, details) {
  return writer.createElement(
    "li",
    null,
    details.child
      .map((el) => {
        if (el.tag === "summary") {
          return el.child.map((ch) => {
            const tag = ch.tag || "paragraph";
            const markup = ch.attr && ch.attr.markup;
            const markupIsArray = Array.isArray(markup);
            const attributes =
              tag === "abbr"
                ? {
                    class: ch.tag === "abbr" ? "th-pill" : "",
                    id: uuidv4(),
                    markup: markupIsArray ? markup.join(" ") : markup,
                  }
                : {};
            return writer.createElement(
              tag,
              attributes,
              ch.text || ch.child[0].text
            );
          });
        }

        const iterableElement =
          el.child[0].tag === "ul" ? el.child[0].child : el.child;
        return writer.createElement(
          "ul",
          null,
          iterableElement.map((ch) => {
            if (ch.tag === "div") {
              const markupIsArray = Array.isArray(ch.child[0].attr.markup);
              return writer.createElement("li", null, [
                writer.createElement(
                  "abbr",
                  {
                    class: "th-pill",
                    id: uuidv4(),
                    markup: markupIsArray
                      ? ch.child[0].attr.markup.join(" ")
                      : ch.child[0].attr.markup,
                  },
                  ch.child[0].child[0].text
                ),
              ]);
            }

            if (ch.tag === "details") return getNestedList(writer, ch, false);
          })
        );
      })
      .flat()
  );
}

function getNestedList(writer, details, firstIter = true) {
  if (firstIter)
    return writer.createElement("ul", null, [
      createListElement(writer, details),
    ]);

  return createListElement(writer, details);
}
