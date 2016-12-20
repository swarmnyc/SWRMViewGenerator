#SWARM View Generator
###Sketch plugin that generates iOS view code from symbols


##Generate this

![generated text](images/output.png)

##From this
![sketch section 1](images/symbol.png)
![sketch section 2](images/preview.png)



###   ---------------------------------


##How to set up your sketch file/ What to expect
###Use Symbols
* The plugin works by turning individual symbols into subclassed UIViews.

###Text Areas 
* Any piece of text in your design will be output as a UILabel. After exporting you can always change it to whatever you want in XCode
* Sometimes font names can get funky, you may need to manually update what is exported.
![text area](images/UILabel.png)

###Images
* Anything that is set to exportable will be treated as an image.
* You will need to import the actual UIImage and set it manually.
![images](images/imageview.png)

###Sub Symbols
* If there is a symbol inside of the symbol you are exporting it is treated as if it is of a custom UIView subclass.
![symbols](images/symbolDecleration.png)

###Everything else is ignored
* For now, everything else is ignored. If you want it to be exported make it exportable or fork this repo and help us add use cases.

###Set Constraints
* There are two commands inside of this plugin. Before generating the code you should set up the constraints so that the script can make educated guesses about how to set up the autolayout code.



