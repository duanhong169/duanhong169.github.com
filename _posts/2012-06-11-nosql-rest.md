Title: NOSQL & REST & DSL & Event Sourcing
Date: 2012-06-12 13:50
Tags: nosql, rest, DSL, Event-Sourcing

今天听了[Martin Fowler](http://www.martinfowler.com)的演讲，虽然讲的内容并不多，但是讲的都是当今软件开发中最重要的技术和原则，这些都是这个时代的程序员所应该熟知的，在此简单地做一个总结。
1. NoSQL Models
----------------
由于目前的应用数据存储对分布式、可扩展性方面的需求，NoSQL作为新一代的数据库组织方式逐渐被人们放上台面，所谓[NoSQL](http://nosql-database.org/)，并不应该被简单的理解为"No" SQL，而更应该被理解为“Not only SQL”，它通常具有非关系型、分布式、开源和水平可扩展等几个特性。

与关系数据库通常遵循的是ACID(atomicity-原子性, consistency-一致性, isolatio-隔离性, durability-持久性)不同，NoSQL所遵循的是BASE(Basically Available-基本可用, Soft state-软状态, Eventually consistent-最终一致性)，这些特性正是与当前分布式存储、云计算领域的需求相符合的。具体的不同可以参照[这篇文章](http://it.toolbox.com/blogs/oracle-guide/acid-vs-base-25938)。

2. REST
----------------
`REST`即Representational State Transfer，通常被译为“表述性状态转移”，这是一个用于分布式系统的软件体系结构，最大的一个应用当属我们的万维网（World Wide Web）了，REST在最近几年已经逐步成为了Web service的主要设计模式，通常我们说一个Web Service的API是RESTful的，实际上就是指它具备了REST的特性，以Web为例，REST具有如下一些特性：

1. 网络上所有的事物都被抽象为资源（resource）；
2. 每个资源对应一个唯一的资源标识（resource identifier）；
3. 可以通过通用的连接器接口对资源进行操作（generic connector interface）；
4. 对资源的各种操作不会改变资源标识；
5. 所有的操作都是无状态的（stateless）

按Martin所述，按照[Richardson Maturity Model](http://martinfowler.com/articles/richardsonMaturityModel.html)，REST按程度不同通常如下四个阶段：

![rest-overview](http://martinfowler.com/articles/images/richardsonMaturityModel/overview.png)
图1. [Steps toward REST](http://martinfowler.com/articles/images/richardsonMaturityModel/overview.png)

1.  Level 0：

    最初级的阶段，将HTTP当作一个可以进行远程交互的通讯系统来使用，在这个阶段不会使用到web的任何机制，而仅仅将HTTP作为远程交互机制。
以一个示例来简单地说明：如果我们需要通过web预约一位医生，通常会经历如下步骤：
    -  `POST /appointmentService?data=2010-01-04&doctor=mjones`
        获取到在2010年1月4号MJones医生的所有可预约时间段，我们会得到服务器响应传回的一个列表
    -  `POST /appointmentService?data=2010-01-04&doctor=mjones&start=1400&end=1450`
        请求预约2010年1月4号MJones医生从14点到14点50这个时间段，服务器会根据预约是否成功返回响应

2.  Level 1 - Resources：
    
    在这个阶段，API的设计开始以Resource（资源）为中心，现在将不通过参数的形式向appointmentService提供数据，而是将医生、医生的可预约时间段都视为资源，这时预约医生将变为如下形式：
    -  `POST /doctors/mjones`  将返回MJones可预约时间列表
    -  `POST /slots/1234`      预约编号为1234的时间段，这个id已经对应了一个唯一的医生->时间段资源
    
    可以感受到，现在的调用方式已经具备了“对象”的感觉。
    
3.  Level 2 - HTTP Verbs：
    
    这个阶段开始使用不同的HTTP Verb来对资源进行不同的操作，HTTP Verbs包括`GET/POST/PUT/DELETE/HEAD/TRACE/CONNECT`等，其中最常用的是`GET/POST/PUT/DELETE`，它们可以被理解为数据库的`READ/CREATE/UPDATE/DELETE`操作（但是Martin在文中指出这样的类比是不正确的）。这时候，可以通过：
        
    `GET /doctors/mjones/slots?date=20100104&status=open`
        
    的形式来获取列表，需要注意的是，使用GET方法来请求数据在Level 2中是关键，因为HTTP将`GET`方法定义为safe operation（安全操作），即`GET`操作不会对任何资源的状态造成影响，可以说`GET`操作是幂等的，因此也是安全的，无论我们执行多少次`GET`方法，我们得到的结果总是一致的，这个特性也使得我们可以更大的发挥caching的作用来提高对HTTP请求响应的效率，HTTP包括了许多的方式来支持caching，遵循这些规则我们能够更好的利用HTTP的性能。如果要预约医生，就需要使用能够改变资源状态的操作，`POST`或者`PUT`都能够改变资源的状态，可以通过Level 1中相同的方式：
    
    `POST /slots/1234`
    
    来完成对医生的预约。
    另外，在Level 2中使用了HTTP response code来表示对资源操作的结果，例如`201(Created)`、`409(Conflict)`。

4.  Level 3 - Hypermedia Controls

    这是REST的最终阶段，通常被描述为`HATEOAS`（Hypertext As The Engine Of Application State），它的意思是，在我们取得了可预约的slots列表之后，能够从响应中知道应该如何进行下一步操作（预约）。通常的RESTful API的每个操作都是独立的对于某个Resource所进行的，如果需要知道在获取了slots列表之后如何进行预约操作通常需要借助于API文档。而Hypermedia Control所要做的就是在服务器的响应中，将会包含进行下一步操作所需要的信息。

继续前面的示例，在这种情况下，预约一位医生的操作所涉及的内容如下：

* 通过`GET /doctors/mjones/slots?date=20100104&status=open`可以获取到服务器响应类似如下内容：

        HTTP/1.1 200 OK
        [various headers]
        
        <openSlotList>
          <slot id = "1234" doctor = "mjones" start = "1400" end = "1450">
             <link rel = "/linkrels/slot/book" 
                   uri = "/slots/1234"/>
          </slot>
          <slot id = "5678" doctor = "mjones" start = "1600" end = "1650">
             <link rel = "/linkrels/slot/book" 
                   uri = "/slots/5678"/>
          </slot>
        </openSlotList>

* 如上第6、7、10、11行的link标签内的信息就是新增的用于表达如何进行预约操作的信息。它告诉我们可以通过/slots/1234这样的url来进行预定操作，于是，通过`POST /slots/1234`可以进行预约，服务器将会发回如下信息：

        HTTP/1.1 201 Created
        Location: http://royalhope.nhs.uk/slots/1234/appointment
        [various headers]
        
        <appointment>
          <slot id = "1234" doctor = "mjones" start = "1400" end = "1450"/>
          <patient id = "jsmith"/>
          <link rel = "/linkrels/appointment/cancel"
                uri = "/slots/1234/appointment"/>
          <link rel = "/linkrels/appointment/addTest"
                uri = "/slots/1234/appointment/tests"/>
          <link rel = "self"
                uri = "/slots/1234/appointment"/>
          <link rel = "/linkrels/appointment/changeTime"
                uri = "/doctors/mjones/slots?date=20100104@status=open"/>
          <link rel = "/linkrels/appointment/updateContactInfo"
                uri = "/patients/jsmith/contactInfo"/>
          <link rel = "/linkrels/help"
                uri = "/help/appointment"/>
        </appointment>

Hypermedia controls的优势在于，服务器可以在不破坏客户端应用程序的情况下对自己的URI schema进行改变。如上例所示，客户端只需要去查阅addTest连接即可，服务端可以随意地对除了最初入口点(slots/1234)之外的所有URI进行改变。

3. DSL
----------------
所谓DSL，全称Domain-specific language，即“领域特定语言”，一个简捷的定义是：一种专注于某个特定领域的、仅具有有限的表述能力编程语言。按我的理解来说就是专注于某类功能或逻辑的实现，并且在该部分领域拥有极高的表达力和执行效率的语言。这类语言在实际应用中也是很常见的，例如正则表达式、CSS、makefile/ant/rake、SQL/HQL，甚至用于编写struct-config.xml文件的语法也可以被认为是一种DSL。基于DSL的定义，一般来说我们并不能够使用某种DSL去实现一个完整的项目（谁会只用正则表达式去写一个项目呢XD），而是在一个项目中使用一种通用编程语言并且结合使用若干DSL。事实上，DSL也是通过所谓通用编程语言来实现的，这实际上也是“不要自己从头再实现轮子”思想的体现，借助DSL我们可以在一个更高的层次上编程，使得代码更紧凑，从而获得更高的效率，DSL就好比是一个被精心制造出来的轮子。DSL目前在Ruby社区非常的火爆，借助Ruby开发人员可以更方便地去实现一种DSL，例如可以用来更高效地写css代码的[SASS](http://sass-lang.com)。

4. Event Sourcing
----------------
Event Sourcing从字面上看就是“事件溯源”的含义，通俗地说就是“记录你所走的每一步”，这是什么样的一个概念呢？最重要的一点实际上就是我们可以将程序的状态（动态）保存到磁盘（静态），这样一来我们就不容易丢失程序的某个状态，因为我们可以通过日志文件将状态恢复，最常见的应用就是源代码版本控制系统了（Subversion、Git、mercurial等），当然还包括了记录数据库变迁的DB Migration追踪系统，进一步的遵循了Event Sourcing原则，将数据库的改变也纳入版本控制中，这样一来我们就可以自由的在程序的多个状态中切换。   