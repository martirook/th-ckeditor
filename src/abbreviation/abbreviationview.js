/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
  View,
  LabeledFieldView,
  createLabeledInputText,
  ButtonView,
  submitHandler,
  FocusCycler,
} from "@ckeditor/ckeditor5-ui";
import { FocusTracker, KeystrokeHandler } from "@ckeditor/ckeditor5-utils";
import { icons } from "@ckeditor/ckeditor5-core";
import unpillIcon from "./theme/icons/unpill.svg";

export default class FormView extends View {
  constructor(locale) {
    super(locale);

    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    this.abbrInputView = this._createInput("Text");
    this.markupInputView = this._createInput("Markup");

    this.saveButtonView = this._createButton(
      "Save",
      icons.check,
      "ck-button-save"
    );

    // Submit type of the button will trigger the submit event on entire form when clicked
    //(see submitHandler() in render() below).
    this.saveButtonView.type = "submit";

    this.cancelButtonView = this._createButton(
      "Cancel",
      icons.cancel,
      "ck-button-cancel"
    );

    // Delegate ButtonView#execute to FormView#cancel.
    this.cancelButtonView.delegate("execute").to(this, "cancel");

    this.unpillButtonView = this._createButton(
      "Remove Pill",
      unpillIcon,
      "ck-button-cancel"
    );

    this.unpillButtonView.delegate("execute").to(this, "unpill");

    const views = [this.abbrInputView];
    window.ckeditorPillContainsMarkup && views.push(this.markupInputView);
    views.push(this.saveButtonView);
    views.push(this.cancelButtonView);
    views.push(this.unpillButtonView);

    this.childViews = this.createCollection(views);

    this._focusCycler = new FocusCycler({
      focusables: this.childViews,
      focusTracker: this.focusTracker,
      keystrokeHandler: this.keystrokes,
      actions: {
        // Navigate form fields backwards using the Shift + Tab keystroke.
        focusPrevious: "shift + tab",

        // Navigate form fields forwards using the Tab key.
        focusNext: "tab",
      },
    });

    this.setTemplate({
      tag: "form",
      attributes: {
        class: ["ck", "ck-abbr-form"],
        tabindex: "-1",
      },
      children: this.childViews,
    });
  }

  render() {
    super.render();

    submitHandler({
      view: this,
    });

    this.childViews._items.forEach((view) => {
      // Register the view in the focus tracker.
      this.focusTracker.add(view.element);
    });

    // Start listening for the keystrokes coming from #element.
    this.keystrokes.listenTo(this.element);
  }

  destroy() {
    super.destroy();

    this.focusTracker.destroy();
    this.keystrokes.destroy();
  }

  focus() {
    // If the abbreviation text field is enabled, focus it straight away to allow the user to type.
    if (this.abbrInputView.isEnabled) {
      this.abbrInputView.focus();
    }
    // Focus the abbreviation markup field if the former is disabled.
    else {
      this.markupInputView.focus();
    }
  }

  _createInput(label) {
    const labeledInput = new LabeledFieldView(
      this.locale,
      createLabeledInputText
    );

    labeledInput.label = label;

    return labeledInput;
  }

  _createButton(label, icon, className) {
    const button = new ButtonView();

    button.set({
      label,
      icon,
      tooltip: true,
      class: className,
    });

    return button;
  }
}
