// 任务参数组件
(function () {
    let paramsModule = App.RequireModule("helllibjs/params/params.js")//使用params库,定义统一格式的可配置参数
    App.QuestParams = {
    }
    App.QuestNamedParams = new paramsModule.Params(App.QuestParams)
    App.QuestNamedParams.AddString("mqbeichoucanceltihui", 0).WithName("MQ通过北丑Cancel的体会").WithDesc("0禁用，不然体会超过这个值就会去北丑那取消")
    App.QuestNamedParams.AddNumber("mqtihui", 2000).WithName("MQ自动汲取体会").WithDesc("超过这个体会会找机会汲取,小于等于0不起效")
    App.QuestNamedParams.AddNumber("mqnopause", 1).WithName("MQ搜索中不会暂停汲取").WithDesc("0为不会，1为会")
    App.QuestNamedParams.AddString("mqgivebeichou", "t").WithName("MQ给北丑黄金设置").WithDesc("t给，不然不给")
    App.QuestNamedParams.AddString("mqgift", "auto").WithName("MQ接受礼物方式").WithDesc("auto为根据战利品规则自动,no为不获取，否则为逗号分割的道具名清单")
    App.QuestNamedParams.AddString("mqretryfail", "t").WithName("MQ失败后重试").WithDesc("t重试，不然不给")
    App.QuestNamedParams.AddNumber("mqtopslow", 5).WithName("MQ记录的最慢日志数量").WithDesc("0为不记录，其他为记录的慢日志数量")
    App.QuestNamedParams.AddNumber("mqmaxsearch", 2).WithName("MQ最大搜索次数").WithDesc("MQ最大尝试的搜索次数")
    App.QuestNamedParams.AddString("changanjobnoambush", "").WithName("长安任务自动放弃埋伏野兽").WithDesc("t放弃")
    App.QuestNamedParams.AddNumber("dummytransfergold", 500).WithName("Dummy生活费转账金额").WithDesc("每次有ID要生活费时转多少gold")
    App.QuestNamedParams.AddNumber("dummyminkey", 15).WithName("Dummy钥匙囤积数量").WithDesc("大米保持身上至少有多少把钥匙")

})()