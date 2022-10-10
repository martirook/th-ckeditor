/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import AbbreviationCommand from "./abbreviationcommand";
import UnpillCommand from "./unpill";

export default class AbbreviationEditing extends Plugin {
  init() {
    this._defineSchema();
    this._defineConverters();

    this.editor.commands.add(
      "addAbbreviation",
      new AbbreviationCommand(this.editor)
    );

    this.editor.commands.add("unpill", new UnpillCommand(this.editor));
  }
  _defineSchema() {
    const schema = this.editor.model.schema;

    // Extend the text node's schema to accept the abbreviation attribute.
    schema.extend("$text", {
      allowAttributes: ["pillData"],
    });
  }
  _defineConverters() {
    const conversion = this.editor.conversion;

    // Conversion from a model attribute to a view element
    conversion.for("downcast").attributeToElement({
      model: "pillData",

      // Callback function provides access to the model attribute value
      // and the DowncastWriter
      view: (modelAttributeValue, conversionApi) => {
        const { writer } = conversionApi;
        const pillDataObj = modelAttributeValue
          ? modelAttributeValue.split("$$_$$")
          : ["", ""];
        const id = pillDataObj[0];
        const markup = pillDataObj[1];

        return writer.createAttributeElement("abbr", {
          id,
          markup,
          class: "th-pill",
        });
      },
    });

    // Conversion from a view element to a model attribute
    conversion.for("upcast").elementToAttribute({
      view: {
        name: "abbr",
        attributes: ["id", "markup"],
        classes: ["th-pill"],
      },
      model: {
        key: "pillData",

        // Callback function provides access to the view element
        value: (viewElement) => {
          const id = viewElement.getAttribute("id");
          const markup = viewElement.getAttribute("markup");

          return `${id}$$_$$${markup}`;
        },
      },
    });
  }
}
