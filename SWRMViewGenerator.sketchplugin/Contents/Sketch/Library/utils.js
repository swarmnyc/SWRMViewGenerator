var Utils = {};

Utils.runOnEachSelectedLayer = function(selection, loopCount, callback,
  onViewStringCallback, onHitEnd, onConstraintCallback) {


  if (selection.count() == 0) {
    callback("You don't have anything selected", nil);
  } else {
    for (var i = 0; i < selection.count(); i++) {
      callback(nil, loopCount, selection[i], onViewStringCallback, onHitEnd,
        onConstraintCallback);
    }
  }
}

Utils.showAlert = function(str) {
  var alertDialog = [[NSAlert alloc] init]
  [alertDialog setMessageText:str]
  [alertDialog addButtonWithTitle: 'OK']

  var responseCode = [alertDialog runModal]
}


Utils.getChildLayers = function(layer) {
  if (typeof layer.layers != "undefined") {
    return layer.layers();
  } else {
    return [];
  }
}

Utils.getStringWithIndent = function(numberOfSpaces, str) {
  var string = "";
  for (var i = 0; i < numberOfSpaces * 5; i++) {
    string += "--";
  }
  string += str;
  return string;
}

Utils.layerHasChildren = function(layer) {
  if (typeof layer.layers != "undefined" && layer.layers().count() !=
    0) {
    return true;
  }
  return false;
}

Utils.isLayerExportable = function(layer) {
  return layer.isLayerExportable();
}

Utils.isLayerASymbol = function(layer) {
  if (layer.superclass().toString().indexOf("Symbol") != -1) {
    return true;
  } else {
    return false;
  }
}

Utils.isLayerASymbolInstance = function(layer) {
  if (layer.superclass().toString().indexOf("SymbolInstance") != -1) {
    return true;
  } else {
    return false;
  }
}
Utils.isLayerShape = function(layer) {
  if (layer.superclass().toString().indexOf("Shape") != -1) {
    return true;
  } else {
    return false;
  }
}

Utils.isTextLayer = function(layer) {
  if (layer.superclass().toString().indexOf("Text") != -1) {
    return true;
  } else {
    return false;
  }
}

Utils.getMasterSymbol = function(symbolInstance) {
  //log(symbolInstance.symbolMaster());
  return symbolInstance.symbolMaster();
}

Utils.getTextAlignmentString = function(layer) {
  switch (layer.textAlignment()) {
    case 0:
      return ".left";
      break;
    case 1:
      return ".right";
      break;

    case 2:
      return ".center";
      break;

    case 3:
      return ".center"; //THIS IS REALLY JUSTIFIED
      break;
  }

  return ".center";
}


Utils.classString =
  `
class {ClassName}: UIView {

  {subViewDeclerations}

  override init(frame: CGRect) {
      super.init(frame: frame)
      didLoad()
  }

  required init?(coder aDecoder: NSCoder) {
      super.init(coder: aDecoder)
      didLoad()
  }

  func didLoad() {
      {addViewCode}
  }

  override func updateConstraints() {
    {constraintCode}
    super.updateConstraints();
  }


}
`;

Utils.viewDeclerationString =
  `
  lazy private var {viewName}: {classType} = {
    var view = {classType}();
    {viewPropertiesDefinition}
    return view;
  }();
`

Utils.viewPropertiesDefinitionString =
  `
    view.{propertyName} = {propertyValue};
`;

Utils.isLayerConstraints = function(layer) {
  if (layer.name() == "constraints") {
    return true;
  }
  return false;
}


Utils.createViewClassString = function(className, declerationList, classNames,
  instanceNames, constraintString) {
  var str = Utils.classString;
  str = str.replace("{ClassName}", Utils.capitalizeFirstLetter(className));
  var decStrings = "";
  for (var i = 0; i < declerationList.length; i++) {
    decStrings += declerationList[i];
    decStrings += "\n";
  }
  str = str.replace("{subViewDeclerations}", decStrings);
  str = str.replace("{addViewCode}", Utils.createAddViewCode(instanceNames));
  str = Utils.addConstraintString(str, constraintString);
  return str;
}

Utils.addConstraintString = function(classString, constraintString) {
  classString = classString.replace("{constraintCode}", constraintString);
  return classString;
}

Utils.createAddViewCode = function(instancesNames) {
  var str = "";
  for (var i = 0; i < instancesNames.length; i++) {
    str += "self.addSubview(self." + instancesNames[i] + ");";
    str += "\n";
  }
  return str;
}

Utils.capitalizeFirstLetter = function(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

Utils.uncapitalizeFirstLetter = function(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

Utils.createViewDeclerationString = function(viewName, classType,
  propertyDefinition) {
  var str = Utils.viewDeclerationString;
  str = str.replace("{viewName}", viewName);
  str = str.replace("{classType}", classType).replace("{classType}",
    classType);
  str = str.replace("{viewPropertiesDefinition}", propertyDefinition);
  return str;

}

Utils.createPropertyDefinition = function(propertyName, propertyValue) {
  var str = Utils.viewPropertiesDefinitionString;
  str = str.replace("{propertyName}", propertyName);
  str = str.replace("{propertyValue}", propertyValue);
  return str
}

Utils.createPropertyDefinitionList = function(propertyNamesAndValues) {
  var str = "";
  for (var i = 0; i < propertyNamesAndValues.length; i++) {
    var item = propertyNamesAndValues[i];
    str += Utils.createPropertyDefinition(item.propertyName, item.propertyValue);
    str += "\n";
  }
  return str;
}


Utils.chooseADirectory = function() {
  var panel = NSOpenPanel.openPanel();
  panel.canChooseDirectories = true;
  panel.canChooseFiles = false;
  panel.title = "Choose where your view files will be written."
  var result = panel.runModal();
  log(result);
  if (result == 1) {
    log("Selected a directory");
    return panel.URLs()[0];
  }
  log("SELECTED RESULT ^^^");
}

Utils.camelize = function(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}


Utils.getSideConstraint = function(layer, constraint, type) {
  log(constraint);
  if (constraint == "") {
    return "";
  }
  if (constraint.snapView == "" || typeof constraint.snapView == "undefined") {
    return "";
  }

  if (constraint.snapView == "superview") {
    var str = "make." + type + ".equalToSuperview().offset(" + constraint.offset +
      ")";
    return str;
  } else {
    var snapViewName = Utils.uncapitalizeFirstLetter(Utils.camelize(
      constraint.snapView).replace("-", ""));
    log("OPPOSITE SIDE!!!!!!: " + constraint.oppositeSide);
    if (constraint.oppositeSide == 1) {
      snapViewName += ".snp." + Utils.getOpposite(type);
    }
    var str = "make." + type + ".equalTo(self." + snapViewName + ").offset(" +
      constraint.offset + ")";
    return str;
  }
}

Utils.getOpposite = function(type) {
  switch (type) {
    case "left":
      return "right";
    case "right":
      return "left";
    case "top":
      return "bottom";
    case "bottom":
      return "top";
  }

  return "";
}

Utils.getSizeConstraint = function(layer, constraint, type) {


  if (constraint == 0) {
    return "";
  }
  var size = 0;
  if (type == "width") {
    size = layer.frame().width();
  } else {
    size = layer.frame().height();
  }

  var str = "make." + type + ".equalTo(" + size + ")";
  return str;
}

Utils.getConstraintString = function(layer, constraints) {
  // {
  //   top: top,
  //   left: left,
  //   right: right,
  //   bottom: bottom,
  //   useWidth: useWidth,
  //   useHeight: useHeight;
  // }
  log("Constraints: " + layer.name());
  log(layer);
  log(constraints);
  var str = "self." + Utils.camelize(layer.name()) +
    ".snp.remakeConstraints({\n";
  str += "  make in \n";
  str += Utils.getSideConstraint(layer, constraints.top, "top") + "\n";
  str += Utils.getSideConstraint(layer, constraints.left, "left") + "\n";
  str += Utils.getSideConstraint(layer, constraints.bottom, "bottom") + "\n";
  str += Utils.getSideConstraint(layer, constraints.right, "right") + "\n";
  str += Utils.getSizeConstraint(layer, constraints.useWidth, "width") + "\n";
  str += Utils.getSizeConstraint(layer, constraints.useHeight, "height") +
    "\n";
  str += "})";
  return str;

}
