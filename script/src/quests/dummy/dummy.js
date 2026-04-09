$.Module(function (App) {
    let Dummy = {}
    Dummy.WaitDuration = 60 * 1000
    Dummy.Target = ""
    Dummy.NextAskLuban = 0
    //杰二修(Jarlyynb)告诉你：key 123
    //你拿出杰林修家的钥匙(key)给胖胖泡面。
    let matcheraskkey = /^([^：()\[\]]{2,5})\((.+)\)告诉你：key (.+)$/
    let matchermoney = /^([^：()\[\]]{2,5})\((.+)\)告诉你：money (.+)$/
    let PlanWait = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTimer(Dummy.WaitDuration, () => {
                return false
            }).WithName("finish")
            task.AddTrigger(matchergivekey, (tri, result) => {
                App.Log(result[0])
                return true
            })
            task.AddTrigger(matcheraskkey, (tri, result) => {
                let name = result[1]
                let id = result[2].toLowerCase()
                let pass = result[3]
                Note(`收到${name}(${id}）的key请求 密码:${pass}`)
                if (pass != "" && pass == App.Core.Dummy.Password) {
                    App.Send(`give key to ${id};i`)
                    return false
                }
                return true
            }).WithName("key")
            task.AddTrigger(matchermoney, (tri, result) => {
                let name = result[1]
                let id = result[2].toLowerCase()
                let pass = result[3]
                Note(`收到${name}(${id}）的打生活费要求 密码:${pass}`)
                if (pass != "" && pass == App.Core.Dummy.Password) {
                    if (App.Data.Player.Score["存款"] > App.QuestParams["dummytransfergold"]) {
                        Dummy.Target = id
                        return false
                    } else {
                        PrintSystem(`存款不足，无法转账`)
                    }
                }
                return true
            }).WithName("money")
        },
        (reuslt) => {
            if (reuslt.Name == "money") {
                Dummy.GoTransfer()
                return
            }
            $.Next()
        }
    )
    Dummy.GoTransfer = function () {
        $.PushCommands(
            $.To("qz"),
            $.Nobusy(),
            $.Do(`transfer ${App.QuestParams["dummytransfergold"]} gold to ${Dummy.Target};score;`),
            $.Nobusy(),
        )
        $.Next()
    }
    Dummy.Wait = function () {
        $.PushCommands(
            $.To("chat"),
            $.Plan(PlanWait),
        )
        $.Next()
    }
    let PlanAskLuban = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.AddTrigger("鲁班正忙着呢，没空理你...", (tri, result) => {
                Dummy.NextAskLuban = $.Now() + 15 * 60 * 1000
                PrintSystem("过15分钟再找鲁班")
                return true
            })
            App.Send("ask lu ban about key;give 10 silver to lu ban;i")
            App.Sync();
        }, (result) => {
            $.Next()
        })
    Dummy.AskKey = function () {
        $.Insert($.Function(Dummy.Start))
        $.PushCommands(
            $.To("qz"),
            $.Do("qu 10 silver"),
            $.Nobusy(),
            $.To("lu ban"),
            $.Plan(PlanAskLuban),
        )
        $.Next()
    }
    Dummy.Start = function (data) {
        $.PushCommands(
            $.Prepare("commonWithQuestDummy"),
            $.Function(Dummy.Wait),
        )
        $.Next()
    }

    App.Proposals.Register("quest.dummy", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.Mapper.HouseID) {
            if (App.Data.Item.List.FindByID("key").Sum() < App.QuestParams["dummyminkey"] && $.Now() > Dummy.NextAskLuban) {
                return function () {
                    Dummy.AskKey()
                }
            }
        }
        return null
    }))
    App.Proposals.Register("commonWithQuestDummy", App.Proposals.NewProposalGroup("common", "quest.dummy"))
    let matchergivekey = /^你拿出.+家的钥匙\(key\)给.+。$/
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matchergivekey, (tri, result) => {
                App.Log(result[0])
                return true
            })
        })
    let Quest = App.Quests.NewQuest("dummy")
    Quest.Name = "聊天大米"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "dummy"
    App.Quests.Register(Quest)

    Quest.Start = function (data) {
        PlanQuest.Execute()
        Dummy.Start(data)
    }
    Quest.GetReady = function (q, data) {
        return () => { Quest.Start(data) }
    }
})