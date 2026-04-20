* 升级hmm.js的版本，极大的提升寻路时shortcut的性能
* 引入寻路缓存(node-lru-cache)，优化CPU占用，可以通过系统参数的 cachemax和cachemaxsize进行调整
* 加入等待服务器维护功能，接近服务维护时间所有人物会停止进入聊天室等待。
* shared目录加入quest_params和policy_params的全局配置文件
* 加入战略管理功能，用于全局性跨任务的全局战略配置。第一期加入死亡处理和自动吃露
* 调整drop head逻辑
* 其他优化
2026/04/16
* shared目录中添加house,dummy,params的全局配置文件
* 配合新版本客户端，可以加载game/hongchejs/shared/下的assets.txt和items.txt配置
* 加入参数JiquMaxAhead，控制自动经验时武学最多领先其他武学多少等级，避免初期武学脱节
* 吃喝流程优化
* 整合所有任务的经验，潜能，体会到成长汇报模块
* mq加入防鞭尸
* 锄奸引入chujiannohitfor和chujianmaxcombat参数，遇到无法破防和打不动的敌人时自动放弃
* 优化mq砍头逻辑
2026/04/14
* 引入动态max_exp模式，max_exp为 +2000 的格式时，会按当前最高武学技能的级别+3计算必须经验，再加+号后的数字，作为max_exp的值。
* 加入移动超时日志与重试机制
* 长安任务，Funquest,保护任务也提供线报支援
* item变量的#qu支持从聊天室取道具，逻辑同sell变量的#home
* sell变量的#home指令加入最大持有数量，配合item变量的#qu
* item变量加入#nobox,确保不会从百宝箱存取东西
* lian变量支持去三味书屋读书
* lian和study变量的等级限制支持 参考技能*比例的格式，方便控制部分高难度系数技能脱节
* 加入钥匙储备，防止鲁班出问题后无法Ask钥匙
* 加入任务参数changanjobnoambush ,没战斗力时不做ambush任务
* 加入任务参数tianlaonosearch，天牢任务放弃遍历房间之间去出口，适合不需要资源保年龄/气血的ID
* 加入任务参数chujiancancelat,锄奸放弃设定，配合保护用
* 加入要生活费和大米自动转账的功能
* 助理根据师傅的技能设置学习列表的功能
* 加入 #noob 指令,制动执行funquest,changanjob,peiyao,并自动学drawing到31
* 加入funquest,changanjob,peiyao,zhonghua等新人任务
* 加入letter 师门送信任务
* 加入#shengchaojing 拿神照经
* 助理加入根据师傅武功初始化学习列表的功能
* 时间切片统计优化
* 灵感塔加入奖励统计
* 加入任务变量mqbeichoucanceltihui，体会超过一定值后会去北丑cancel任务
* 其他修正
2026/03/26
* 加入未设置房间或者没钥匙时，会自动将物品给dummy