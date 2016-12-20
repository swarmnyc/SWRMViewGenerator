var classString = `
class ${ClassName}: UIView {

  ${subViewDeclerations}

  override init(frame: CGRect) {
      super.init(frame: frame)
      didLoad()
  }

  required init?(coder aDecoder: NSCoder) {
      super.init(coder: aDecoder)
      didLoad()
  }

  func didLoad() {
      ${addViewCode}
  }

}
`

var viewDeclerationString = `
  lazy var ${functionName} = {
    var view = ${classType}();

    return view;
  }();
`
