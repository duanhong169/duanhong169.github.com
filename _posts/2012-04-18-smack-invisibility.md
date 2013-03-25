Date: 2012-04-18 18:01:00
Slug: smack-invisibility
Title: Smack设置隐身状态
Tags: Invisibility, Smack, XMPP

什么是`Smack`？

Smack is a library for communicating with XMPP servers to perform real-time communications, including instant messaging and group chat
[[1]](http://www.igniterealtime.org/builds/smack/docs/latest/documentation/overview.html).
`Smack`是一个用于与XMPP服务器通讯的Java类库，它使得我们可以方便的通过XMPP协议来进行即时通讯，群聊等。

新浪微博的即时通讯功能也是基于XMPP协议实现的，因此我们可以通过任何支持XMPP协议的客户端来连接它，从而使用它来与新浪微博中互相关注的好友进行聊天，这些聊天记录也会以私信的方式保存在新浪微博里。新浪微博的XMPP服务器地址是xmpp.weibo.com，端口是缺省的5222端口，用户名可以是你注册的邮箱或者是你的UID，可以到[JWChat](http://jwchat.org/)测试一下连接。

对于通常的聊天客户端来说，用户一般都需要使用到“隐身（invisibility）”状态，即自身对于其他用户是离线的状态，而自身却依然能够接收到其他用户发来的消息。在Smack中用户通过向服务器发送[Presence](http://www.igniterealtime.org/builds/smack/docs/latest/javadoc/org/jivesoftware/smack/packet/Presence.html)包来设置自己的状态，通过发送这个数据包可以向服务器发送一些与用户状态相关的请求，设置Presence的[Type](http://www.igniterealtime.org/builds/smack/docs/latest/javadoc/org/jivesoftware/smack/packet/Presence.Type.html)属性可以用于说明该Presence包的用途（包括上线（available）、下线（unavailable）、请求订阅其他用户的状态（subscribe）、允许其他用户订阅自己的状态（subscribed）等等），通过设置Presence的[Mode](http://www.igniterealtime.org/builds/smack/docs/latest/javadoc/org/jivesoftware/smack/packet/Presence.Mode.html)属性用于说明自己当前的状态（包括了在线（available）、离开（away）、等待聊天（chat）、忙碌（dnd）、长时间离开（xa）等状态），在Smack的较早版本中的Presence是可以直接设置为隐身（invisibility）的，然而这却违反了XMPP RFC，因此在2006年的6月就已经将这个隐身状态从Smack API中移除了[[2]](http://issues.igniterealtime.org/browse/SMACK-147?page=com.atlassian.streams.streams-jira-plugin:activity-stream-issue-tab)。

XMPP RFC认为隐身实际上是一个不必要独立存在的一个状态，因为在实际应用时，只要你不给你的其他联系人发送available类型的Presence，那么你的联系人就是不会看见你在线的，也就是达到了和隐身相同的效果，XMPP文档[XEP-0126](http://xmpp.org/extensions/xep-0126.html)对于这种隐身功能的实现做了十分详细的说明。

那么在`Smack`中如何实现隐身状态呢，事实上有一种简单的实现办法，虽然不确定它的完善性，但是还是在一定程度上可用的。在这里对这种简单的实现做一个描述，可用性在Android平台上进行了验证。代码片段如下：

<script src="https://gist.github.com/duanhong169/5235205.js"></script>

其中，case 3就是用于设置隐身的代码，设置隐身时，首先获取到当前的联系人列表，然后向联系人逐个发送“unavailable”状态，然后再向自己它处登录的客户端发送“unavailable”状态，而由于没有向服务器发送unavailable的状态，因此还是能够接收到联系人发送过来的消息，从而实现了隐身状态。
