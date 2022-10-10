/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";
import { ContextualBalloon, clickOutsideHandler } from "@ckeditor/ckeditor5-ui";
import FormView from "./abbreviationview";
import { getRangeText, uuidv4 } from "./utils.js";
import PillIcon from "./theme/icons/pill.svg";

export default class AbbreviationUI extends Plugin {
  static get requires() {
    return [ContextualBalloon];
  }

  init() {
    const editor = this.editor;

    // Create the balloon and the form view.
    this._balloon = this.editor.plugins.get(ContextualBalloon);
    this.formView = this._createFormView();

    editor.ui.componentFactory.add("pill", () => {
      const button = new ButtonView();

      button.label = "Pill";
      button.icon = PillIcon;
      button.keystroke = "Ctrl+P";
      button.tooltip = true;
      button.withText = true;

      // Show the UI on button click.
      this.listenTo(button, "execute", () => {
        this._showUI();
      });

      // Setting Ctrl+P combination to open the pill command
      editor.keystrokes.set("Ctrl+P", (keyEvtData, cancel) => {
        // Prevent focusing the search bar in FF, Chrome and Edge. See https://github.com/ckeditor/ckeditor5/issues/4811.
        cancel();
        // Show UI

        this._showUI();
      });

      // Setting Ctrl+P combination to open the pill command
      editor.keystrokes.set("Tab", (keyEvtData, cancel) => {
        cancel();
        const commandValue = editor.commands.get("addAbbreviation").value;
        commandValue && editor.execute("addAbbreviation", commandValue);
      });

      return button;
    });
  }

  _createFormView() {
    const editor = this.editor;
    const formView = new FormView(editor.locale);

    // Execute the command after clicking the "Save" button.
    this.listenTo(formView, "submit", () => {
      // Grab values from the abbreviation and markup input fields.
      const abbrElement = formView.abbrInputView.fieldView.element;
      const markupElement = formView.markupInputView.fieldView.element;

      const value = {
        id: uuidv4(),
        abbr: abbrElement ? abbrElement.value : "",
        markup: markupElement ? markupElement.value : "",
      };
      editor.execute("addAbbreviation", value);

      // Hide the form view after submit.
      this._hideUI();
    });

    // Hide the form view after clicking the "Cancel" button.
    this.listenTo(formView, "cancel", () => {
      this._hideUI();
    });

    this.listenTo(formView, "unpill", () => {
      editor.execute("unpill");
      this._hideUI();
    });

    // Hide the form view when clicking outside the balloon.
    clickOutsideHandler({
      emitter: formView,
      activator: () => this._balloon.visibleView === formView,
      contextElements: [this._balloon.view.element],
      callback: () => this._hideUI(),
    });

    return formView;
  }

  _showUI() {
    const selection = this.editor.model.document.selection;

    // Check the value of the command.
    const commandValue = this.editor.commands.get("addAbbreviation").value;

    this._balloon.add({
      view: this.formView,
      position: this._getBalloonPositionData(),
    });

    // Disable the input when the selection is not collapsed.
    this.formView.abbrInputView.isEnabled =
      selection.getFirstRange().isCollapsed;

    // Fill the form using the state (value) of the command.
    if (commandValue) {
      this.formView.abbrInputView.fieldView.value = commandValue.abbr;
      this.formView.markupInputView.fieldView.value = commandValue.markup;
    }
    // If the command has no value, put the currently selected text (not collapsed)
    // in the first field and empty the second in that case.
    else {
      const selectedText = getRangeText(selection.getFirstRange());

      this.formView.abbrInputView.fieldView.value = selectedText;
      this.formView.markupInputView.fieldView.value = "";

      /// Automatically create pill if user is admin and text is selected
      if (selectedText && !window.ckeditorPillContainsMarkup) {
        this.formView.fire("submit");
        return;
      }
    }

    this.formView.focus();
  }

  _hideUI() {
    // Clear the input field values and reset the form.
    this.formView.abbrInputView.fieldView.value = "";
    this.formView.markupInputView.fieldView.value = "";
    this.formView.element.reset();

    this._balloon.remove(this.formView);

    // Focus the editing view after inserting the abbreviation so the user can start typing the content
    // right away and keep the editor focused.
    this.editor.editing.view.focus();
  }

  _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    let target = null;

    // Set a target position by converting view selection range to DOM
    target = () =>
      view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange());

    return {
      target,
    };
  }
}
