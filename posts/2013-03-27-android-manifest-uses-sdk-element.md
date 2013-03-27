Title: AndroidManifest中uses-sdk的含义和用法
Date: 2013-03-27 23:50
Slug: android-manifest-uses-sdk-element
Tags: android

`uses-sdk`是AndroidManifest.xml文件中的一个元素，它用于声明当前的应用程序与各版本Android平台的兼容性，具体则是使用[API Level](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html#ApiLevels)值（整数值，目前已发展到17）作为指标。`uses-sdk`包含如下三个属性：

-  `android:minSdkVersion`
-  `android:targetSdkVersion`
-  `android:maxSdkVersion`

例如，你可以通过如下方式指定应用程序正常运行所需的最低版本为API Level 8：
        
    <manifest>
        <uses-sdk android:minSdkVersion="8" android:targetSdkVersion = 17/>
    </manifest> 

`android:minSdkVersion`和`android:maxSdkVersion`比较容易理解，它们分别代表了应用程序所能支持的最低和最高API Level，也就是说在任何低于`android:minSdkVersion`或者高于`android:maxSdkVersion`的Android系统中运行该应用程序都会面临崩溃的可能（当应用程序访问到在当前API Level中不存在的API时）。由于Android的API演进是以递增的形式进行的，因此Android的API是[向前兼容的](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html#fc)，所以在大部分情况下都不需要考虑`android:maxSdkVersion`。

`android:targetSdkVersion`则相对难理解一点，根据官方文档的说法，这个值是为了指定该应用程序所针对的目标API Level，它的默认值等于`android:minSdkVersion`。实际上，这个值的根本作用是指引Android系统的兼容行为（compatibility behavior），什么是Android系统的兼容行为呢？在前面已经提到Android的API是向前兼容的，即新版本的系统能够直接运行在旧版本系统上开发的应用程序，这种向前兼容的能力就是借助Android的兼容行为实现的。

通过观察Android对UI的兼容行为，可以比较具体地理清这之间的关系，Android 4.0之后版本的UI与Android 2.3之前版本的UI相比，其中的变化是十分明显的，凭借Android的向前兼容机制，在Android 2.3版本上开发的应用能够之间在Android 4.0上运行，这时候它们的UI就会受到`android:targetSdkVersion`值的影响。如果`android:targetSdkVersion`未定义，那么在Android 4.0上该应用程序的UI将会仍然保持Android 2.3的风格，而如果`android:targetSdkVersion`定义为14或更高（Android 4.0+），就会使得该应用程序的UI呈现Android 4.0风格，这种差异正是由于`android:targetSdkVersion`值可以停用Android向前兼容行为而引起的。

Android官方文档还建议开发者应当在API Level升级的同时，将`android:targetSdkVersion`的值更新至最新的API Level值，并且同时在最新版本的Android平台上通过测试，从而使得应用程序达到较好的用户体验。

`android:targetSdkVersion`还有一个作用就是可以使得应用程序可以使用高于`android:minSdkVersion`的API Level的API，但是开发者必须保证其对于`android:minSdkVersion`版本的向后兼容性（backward compatibility），即开发者可以使用相比`android:minSdkVersion`更高版本API中新增的特性来实现相应功能，但是必须确保应用程序运行在不能使用这些特性的系统时也能保持正常，即使用这些新特性所实现的功能是为应用程序“增色”而并非“必须”，详细地讨论可以参考stackoverflow上Steve Haley的[答案](http://stackoverflow.com/a/4994039/971070)，Steve以手势识别功能为例进行了说明，手势识别是API Level 7新增的API，因此对于声明`android:minSdkVersion = 3 android:targetSdkVersion = 17`的应用程序来说，当运行该应用程序的系统版本支持API Level 7时，应用程序就能够使用手势识别来实现快捷操作，但是在系统版本不支持API Level 7时，仍然可以通过菜单实现同样的功能。

在`android:minSdkVersion`与`android:targetSdkVersion`不一致的情况下，为了防止API访问错误，通常需要使用与如下[代码](http://android-developers.blogspot.hk/2010/07/how-to-have-your-cupcake-and-eat-it-too.html)类似的方式来对API Level进行判断：

<script src="https://gist.github.com/duanhong169/5256634.js"></script>

总的来说，为了使得应用程序的潜在用户数量更大，我们应当使用较低的`android:minSdkVersion`和较高的`android:targetSdkVersion`，前提当然是必须充分考虑应用程序的兼容性，否则只会使得用户在无尽的程序崩溃中潸然泪下，然后到Google Play中默默地为你的应用程序送上1星评价。