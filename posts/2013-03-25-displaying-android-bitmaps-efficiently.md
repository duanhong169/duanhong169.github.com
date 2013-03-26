Title: 在Android中高效地显示图片
Date: 2013-03-25 23:50
Slug: displaying-android-bitmaps-efficiently
Tags: android, bitmap, performance

图片资源是移动应用中较耗内存的部分，同时也是最常用的资源之一。对于涉及大量图片的应用、尤其是图片资源需要通过网络连接获取的应用，需要达到如下一些基本要求:

-  防止内存过度消耗（`java.lang.OutofMemoryError`）导致程序崩溃
-  防止由耗时操作引起的界面卡顿，使得应用程序界面在加载图片的同时保持流畅
-  通过对图片进行缓存减少对外部存储的读取和网络流量的使用，提高图片加载效率

这里结合示例来说明如何使得应用程序满足上述要求，示例代码可以从[这里](http://developer.android.com/shareables/training/BitmapFun.zip)得到，示例来自于[Android Training Site](http://developer.android.com/training/index.html)。

###加载合适的图片尺寸

采用普通方法同时在应用程序中加载大量图片，就容易造成内存溢出。这很容易理解，目前一般的手机摄像头拍摄的照片分辨率能够达到500万像素以上，按每个像素4字节（RGBA各需要1字节）计算，完全加载这样一张图片就需要5\*4=20兆字节的内存，对于列表视图（`ListView`）、网格视图（`GridView`）以及实现多页面滚动效果的`ViewPager`来说，它们都需要同时对大量图片进行处理，使用直接加载图片的方式需要使用大量的内存。

通常情况下，需要在用户界面中显示的图片往往小于它们的原始尺寸，因此可以根据具体的显示需求对图片资源进行解码，仅仅将必须的部分载入内存，从而减小内存的使用。在Android中，`BitmapFactory`类提供了很多方法用于将指定的图片文件解码为bitmap对象，例如`decodeByteArray()`, `decodeFile()`, `decodeResource()`等等方法，这些方法默认会解码完整的图片资源数据到内存中，容易造成内存资源的浪费，为此，Android提供了`BitmapFactory.Options`类来对`BitmapFactory`的解码过程进行控制，`BitmapFactory.Options`包含了一系列以`in`和`out`开头的字段，分别用于设置解码方式和存放解码得到的结果。

将`inJustDecodeBounds`字段值设为`true`可以在不将图片加载到内存的前提下获取到图片的相关信息（主要是图片的宽高），对应的解码方法不会将图片载入内存（返回`null`），而是将结果保存在`BitmapFactory.Options`中的各`out`字段（`outHeight`和`outWidth`）里。借助该办法可以知道需要显示的图片尺寸与用于显示该图片的区域尺寸之间的关系，从而确定解码方法的采样率，使得生成的bitmap对象能够在刚好满足显示需求的情况下不占用无必要的内存。

例如，需要显示的图片尺寸为`reqWidth`、`reqHeight`，那么采样率可以通过如下方式得到：

<script src="https://gist.github.com/duanhong169/5235259.js"></script>

计算得到的采样率可以通过`BitmapFactory.Options`的`inSampleSize`进行设置，从而使得解码方法能够根据合适的采样率解码图片，从而避免内存的浪费。

<script src="https://gist.github.com/duanhong169/5235223.js"></script>

###在UI线程之外处理图片

当应用程序中的显示的图片不是从内存中直接获取时（例如从外部存储加载或者通过网络获取），会使得`BitmapFactory`中的各种`decode...()`方法的执行时间变得不可预测，这取决于外部存储的读取速度、网络链接的速度等等因素，如果仍然将图片的处理过程放在UI线程中进行的话，可能会阻塞用户界面，进一步使得系统将应用程序标记为无响应并弹出FC（强制关闭）对话框。为此，应该将图片处理的操作放在单独的线程中进行。

`AsyncTask`是Android提供的用于将耗时操作置于后台线程中执行并且将执行结果返回给UI线程的便捷类，借助它可以使耗时的图片处理过程在后台进行而不阻塞用户界面，`AsyncTask`十分常用，用法也相对简单，在需要显示多个图片时，可以为每一个图片的下载（或读取）操作单独分配一个AsyncTask，多个线程并发执行，使得图片能够尽快的被加载。

当使用多个AsyncTask来处理图片时，需要谨慎地处理并发。对于`ListView`、`GridView`以及类似的其他UI组件，为了提高效率，往往涉及到`View`的回收和再利用过程。以`ListView`为例，它由若干个`View`组成，每个`View`代表了`ListView`中的一项，`ListView`所包含的内容通常由`ListAdapter`提供，由这个Adapter提供的数据列表往往很长，例如常见的联系人列表和聊天信息列表，这些较大量的数据不能够在一个屏幕空间中同时显示，用户需要通过滚动列表的方式来浏览列表中的更多数据，这个滚动的过程就是各个`View`回收和再利用的过程，在理论上，系统内存中仅仅需要存在刚好能够铺满一个屏幕的数量的`View`，当用户向下滑动屏幕看到列表中新的一项内容时，伴随着这个操作的结果是原本处于屏幕最上方的一项内容被移出界面，这时，用于显示原本最上方一项的`View`就会被用于显示下方新出现的一项内容。

借助这个机制可以极大地减少系统资源的占用，但是随之而来的是并发性问题，以此处讨论的图片加载问题为例：当用户界面处于某个状态A，这个状态触发了5个`AsyncTask`（A~E）分别为5个列表项（A~E）加载5张图片，每个`AsyncTask`在运行完成时会更新其对应的列表项中的图片内容，假定`AsyncTaskA`对应更新的列表项为`ItemA`，当用户在`AsyncTaskA`尚未执行完成时滑动了屏幕，使得`ItemA`被移出界面同时新的列表项`ItemF`被显示，与它对应的将会由一个新的`AsyncTaskF`来为其加载图片，由于`ListView`对`View`的回收，此时`ItemF`对应的`View`实际上就是之前`ItemA`对应的`View`，如果没有进行额外的处理，此时`AsyncTaskA`和`AsyncTaskF`的更新目标将会是同一个`View`，此时`AsyncTaskF`比`AsyncTaskA`较早完成，将会导致列表图片显示出现错误，即`ItemF`将会显示图片`ImageA`（即本应该显示在`ItemA`中的图片）。

为了避免上述错误发生，需要将`AsyncTask`与`ImageView`建立起正确的对应关系，使得`AsyncTask`在必要的时候能够判断原先与之对应的`ImageView`是否仍然需要它去更新，为了使`ImageView`能够保持对当前有效的`AsyncTask`的引用，可以通过如下方式实现：

<script src="https://gist.github.com/duanhong169/5235814.js"></script>

这里通过继承`BitmapDrawable`实现了可以保存对`AsyncTask`对象的引用的`AsyncDrawable`类，现在，就可以使用`ImageView.setImageDrawable(asyncDrawable)`方法来使得`ImageView`能够保持对当前有效的`AsyncTask`的引用了。借助于`AsyncDrawable`，可以通过如下方式获取到与某个`ImageView`关联的`AsyncTask`：

<script src="https://gist.github.com/duanhong169/5236583.js"></script>

同样地，还需要在`AsyncTask`中保持对`ImageView`的引用，只需要将`ImageView`作为参数传递给`AsyncTask`即可。

现在，已经能够确定`ImageView`和`AsyncTask`的正确对应关系，当一个`AsyncTask`完成时，可以通过比较之前传入的`ImageView`在当前时刻关联的`AsyncTask`是否等于自身来确定是否应该将结果返回给`ImageView`：

<script src="https://gist.github.com/duanhong169/5236618.js"></script>

通过如上的一些处理，可以防止由多个并发的`AsyncTask`造成的问题，但是仍然存在一个问题，就是当用户滑动`ListView`时，会造成许多没必要的`AsyncTask`在后台执行，虽然已经不会造成图片的显示混乱，但是会浪费不必要的计算资源，为此，可以在每次为`ImageView`新建图片加载任务时，首先获取当前与此`ImageView`相关联的`AsyncTask`，然后判断该`AsyncTask`是否与新建的图片加载任务执行的任务内容一致，如果不一致则终止此次任务，如果一致（当用户来回滑动界面时可能出现这种情况）就不需要再新建`AsyncTask`了。

<script src="https://gist.github.com/duanhong169/5236744.js"></script>

###增加缓存

借助前文所述的两种处理图片的方法，已经可以很好地降低应用程序的内存占用，对于只涉及到少量图片的应用程序来说已经足够，但是对于使用到`ListView`、`GridView`、`ViewPager`这些类来实现功能的应用程序来说，它们需要同时考虑当前屏幕空间和相邻屏幕空间上需要显示的图片，这往往意味着需要对大量图片进行加载，对于用户经常会进行的来回滚屏操作，由于前面提到过的子视图回收和重利用机制，会造成需要进行大量的重复加载相同图片的任务，这时候应该借助缓存来提高图片加载速度，防止大量重复任务的发生（重复从网络下载图片、重复从外部存储读取图片）。

####使用内存空间缓存图片

通过牺牲一定大小的内存空间作为缓存使用，可以极大的提高图片加载效率，在Android中，可以使用`LruCache`类（LRU，最近最少使用）来实现这种缓存。使用`LruCache`必须在初始化时指定为其分配的内存空间大小，这个大小应当根据具体的应用场景、设备屏幕类型、设备内存大小等等因素综合考虑得到。初始化`LruCache`的方法如下：

<script src="https://gist.github.com/duanhong169/5243929.js"></script>

在对`LruCache`进行初始化之后就可以通过如下方式进行存取了：

<script src="https://gist.github.com/duanhong169/5244025.js"></script>

要使用缓存，只需要在加载图片操作之前先访问缓存，通过具体的key值查询缓存中是否存在需要加载的图片对象，如果存在则直接从缓存获取图片，从而加快图片的加载效率。

####使用外部存储缓存图片

对于图片资源来自于网络的应用，仅仅依靠内存来对图片进行缓存是不够的，因为应用程序的内存存在不确定性，随时可能被系统释放（例如用户将应用置于后台运行），为了防止由于内存缓存的失效而导致的对网络资源的重复访问，可以借助外部存储进行缓存，即将图片文件作为文件缓存到外部存储中，虽然位于外部存储中的缓存读取速度较慢，但是它具有比内存更高的稳定性。

要实现基于外部存储的缓存，可以借助`DiskLruCache`类，这个类并不存在于Android API中，可以在[Android的源码](https://android.googlesource.com/platform/libcore/+/master/luni/src/main/java/libcore/io/DiskLruCache.java)中得到，它的使用方法与`LruCache`相似，需要为其指定一个文件路径来放置缓存文件，同时也可以指定其缓存空间大小。与`LruCache`不同之处在于需要对`DiskLruCache`的访问进行同步控制。

<script src="https://gist.github.com/duanhong169/5244099.js"></script>