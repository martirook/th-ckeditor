import Command from "@ckeditor/ckeditor5-core/src/command";

export default class UnpillCommand extends Command {
  refresh() {
    this.isEnabled =
      this.editor.model.document.selection.hasAttribute("pillData");
  }

  execute() {
    const model = this.editor.model;
    const selection = model.document.selection;

    function findPillRange(position, value, model) {
      return model.createRange(
        _findBound(position, value, true, model),
        _findBound(position, value, false, model)
      );
    }

    function _findBound(position, value, lookBack, model) {
      // Get node before or after position (depends on `lookBack` flag).
      // When position is inside text node then start searching from text node.
      let node =
        position.textNode ||
        (lookBack ? position.nodeBefore : position.nodeAfter);

      let lastNode = null;

      while (node && node.getAttribute("pillData") == value) {
        lastNode = node;
        node = lookBack ? node.previousSibling : node.nextSibling;
      }

      return lastNode
        ? model.createPositionAt(lastNode, lookBack ? "before" : "after")
        : position;
    }

    model.change((writer) => {
      // Get ranges to unpill.
      const rangesToUnpill = selection.isCollapsed
        ? [
            findPillRange(
              selection.getFirstPosition(),
              selection.getAttribute("pillData"),
              model
            ),
          ]
        : selection.getRanges();

      // Remove `pillData` attribute from specified ranges.
      for (const range of rangesToUnpill) {
        writer.removeAttribute("pillData", range);
      }
    });
  }
}
