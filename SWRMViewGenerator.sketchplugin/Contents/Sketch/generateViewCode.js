@import "Library/utils.js"
@import "Library/codeFormatter.cocoascript"
var generateViewCode = function(context) {
  var documentName = context.document.displayName();
  log('The current document is named: ' + documentName);
  Plugin.start(context);

};



var Plugin = {};
Plugin.context;
Plugin.document;
Plugin.page;
Plugin.saveDirectory;
Plugin.command;

Plugin.setContext = function(context) {
  Plugin.context = context;
  Plugin.document = context.document;
  Plugin.page = context.document.currentPage();
  Plugin.command = context.command;
}

Plugin.start = function(context) {
  var selectedLayers = context.selection;
  Plugin.setContext(context);
  //Utils.runOnEachSelectedLayer(selectedLayers, 1, Plugin.onSelectedLayerCallback);
  Plugin.startLayerTreeCreate(selectedLayers, function(error, tree) {
    if (error) {
      Utils.showAlert(error);
      return;
    }
    log(tree);
    var code = CodeFormatter.getClassFromTree(tree);
    log(code);
  });
}

Plugin.startLayerTreeCreate = function(layers, callback) {
  if (Plugin.checkIfOneSymbolIsSelected(layers) == false) {
    callback("Please select a Symbol");
    return;
  }
  var layer = layers[0];
  var tree = {};
  tree = Plugin.createLayerTree(tree, layer, true);
  callback(undefined, tree);
}

Plugin.loopThroughSubLayersAndAddToTree = function(layer, tree) {
  var sublayers = Utils.getChildLayers(layer);
  for (var i = 0; i < sublayers.length; i++) {
    var l = sublayers[i];
    tree = Plugin.createLayerTree(tree, l, false);
  }
  return tree;
}


Plugin.createLayerTree = function(tree, layer, isStart) {
  var name = layer.name();
  tree[name] = {};
  if (isStart) {
    tree[name].topLevel = isStart;
  }
  tree[name] = Plugin.addViewDataToTree(tree[name], layer);
  tree[name] = Plugin.addConstraintsToTreeData(tree[name], layer);
  if (Utils.isLayerExportable(layer) == false && Utils.isTextLayer(layer) == false && Utils.isLayerASymbolInstance(layer) == false) {
    tree[name]["children"] = {};
    tree[name]["children"] = Plugin.loopThroughSubLayersAndAddToTree(layer, tree[name]["children"]);
  }

  return tree;
}


Plugin.checkIfOneSymbolIsSelected = function(layers) {
  if (layers.length == 0 || layers.length > 1) {
    return false;
  }

  if (Utils.isLayerASymbol(layers[0]) == false) {
    return false;
  }

  return true;
}


Plugin.addViewDataToTree = function(tree, layer) {
    if (Utils.isTextLayer(layer)) {
        tree = Plugin.addTextLayerDataToTree(tree, layer);
    } else if (Utils.isLayerExportable(layer)) {
        tree = Plugin.addImageLayerDataToTree(tree, layer);
    } else if (Utils.isLayerASymbol(layer)) {
        tree = Plugin.addSymbolLayerDataToTree(tree, layer);
    }
    return tree;
}

Plugin.addSymbolLayerDataToTree = function(tree, layer) {
    tree.type = Utils.capitalizeFirstLetter(Utils.camelize(layer.name()));

    return tree;
}

Plugin.addImageLayerDataToTree = function(tree, layer) {
    tree.type = "UIImage";
    return tree;
}

Plugin.addTextLayerDataToTree = function(tree, layer) {
    tree.type = "UILabel";
    tree.font = layer.font().fontName();
    tree.fontPointSize = layer.font().pointSize();
    tree.alignment = Utils.getTextAlignmentString(layer);
    tree.text = layer.stringValue();
    var color = layer.styleAttributes()["NSColor"];
    tree.colorStr = "UIColor(redLiteral: " + color.redComponent() + " green: " + color.greenComponent() +
      " blue: " + color.blueComponent() + " alpha " + color.alphaComponent() + ")";
    return tree;
}

Plugin.getOffsetForConstraint = function(type, constraint, layer) {
    var parent = layer.parentSymbol();
    if (parent == layer || constraint.snapView == "") {
      log("SAME THING!");
      return "";
    }
    var layerPos = layer.frame().origin().x;
    if (type == "top") {
      layerPos = layer.frame().origin().y;
    }else if (type == "bottom") {
      layerPos = layer.frame().origin().y + layer.frame().size().height;
    } else if (type == "right") {
      layerPos = layer.frame().origin().x + layer.frame().size().width;
    }

    var otherLayer = parent;
    if (constraint.snapView != "superview") {
      var children = Utils.getChildLayers(parent);
      for (var i = 0; i < children.length; i++) {
        if (children[i].name() == constraint.snapView) {
          otherLayer = children[i];
        }
      }
    }
    var oppositeSide = constraint.oppositeSide;

    var otherLayerPosition = otherLayer.frame().origin().x;
    if (constraint.snapView != "superview") {
    if ((type == "left" && oppositeSide == 0) || (type == "right" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.frame().origin().x;
    } else if ((type == "right" && oppositeSide == 0) || (type == "left" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.frame().origin().x + otherLayer.frame().size().width;
    } else if ((type == "top" && oppositeSide == 0) || (type == "bottom" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.frame().origin().y;
    } else if ((type == "bottom" && oppositeSide == 0) || (type == "top" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.frame().origin().y + otherLayer.frame().size().height;
    }
  } else {
    log(otherLayer.bounds());
    if ((type == "left" && oppositeSide == 0) || (type == "right" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.bounds().origin.x;
    } else if ((type == "right" && oppositeSide == 0) || (type == "left" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.bounds().origin.x + otherLayer.bounds().size.width;
    } else if ((type == "top" && oppositeSide == 0) || (type == "bottom" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.bounds().origin.y;
    } else if ((type == "bottom" && oppositeSide == 0) || (type == "top" && oppositeSide == 1)) {
      otherLayerPosition = otherLayer.bounds().origin.y + otherLayer.bounds().size.height;
    }
  }

    log(constraint);
    log(layer);
    log(otherLayer);
    log(type);
    log("layer:" + layerPos);
    log("snapView: " + otherLayerPosition);
    var offset = layerPos - otherLayerPosition;
    log(offset);
    log('--------');
    return offset;
}

Plugin.addConstraintsToTreeData = function(tree, layer) {
  var command = Plugin.command;
  var t = [command valueForKey:"top-constraint" onLayer:layer forPluginIdentifier:"SWRM"];
  var l = [command valueForKey:"left-constraint" onLayer:layer forPluginIdentifier:"SWRM"];
  var b = [command valueForKey:"bottom-constraint" onLayer:layer forPluginIdentifier:"SWRM"];
  var r = [command valueForKey:"right-constraint" onLayer:layer forPluginIdentifier:"SWRM"];
  var h = [command valueForKey:"height" onLayer: layer forPluginIdentifier:"SWRM"];
  var w = [command valueForKey:"width" onLayer: layer forPluginIdentifier:"SWRM"];
  log(h);
  log(w);
  var top, left, bottom, right, height, width;
  if (t != null) {

    top = {};
    top.snapView = t.snapView;
    top.oppositeSide = t.oppositeSide;
    top.offset = Plugin.getOffsetForConstraint("top", top, layer);
  } else {
    top = {offset: "", snapView: "", oppositeSide: false};
  }

  if (l != null) {
    left = {};
    left.snapView = l.snapView;
    left.oppositeSide = l.oppositeSide;
    left.offset = Plugin.getOffsetForConstraint("left", left, layer);
  } else {
    left = {offset: "", snapView: "", oppositeSide: false};
  }

  if (b != null) {
    bottom = {};
    bottom.snapView = b.snapView;
    bottom.oppositeSide = b.oppositeSide;
    bottom.offset = Plugin.getOffsetForConstraint("bottom", bottom, layer);
  } else {
    bottom = {offset: "", snapView: "", oppositeSide: false};
  }

  if (r != null) {
    right = {};
    right.snapView = r.snapView;
    right.oppositeSide = r.oppositeSide;
    right.offset = Plugin.getOffsetForConstraint("right", right, layer);
  } else {
    right = {offset: "", snapView: "", oppositeSide: false};
  }

  if (h == null) {
    height = {"useHeight": 0, "snapView": ""};
  } else {
    height = {};
    height.useHeight = h.useHeight;
    height.snapView = h.snapView;
    if (h.useHeight == 1) {
      log(layer.frame().size().height);
      height.value = layer.frame().size().height;
    }
  }

  if (w == null) {
    width = {"useWidth": 0, "snapView": ""};
  } else {
    width = {};
    width.useWidth = w.useWidth;
    width.snapView = w.snapView;
    if (h.useWidth == 1) {
      width.value = layer.frame().size().width;
    }
  }


  var constraints = {};
  constraints.top = top;
  constraints.bottom = bottom;
  constraints.left = left;
  constraints.right = right;
  constraints.width = width;
  constraints.height = height;
  tree.constraints = constraints;
  return tree;

}
