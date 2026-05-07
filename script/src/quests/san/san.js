$.Module(function (App) {
    let imbue_items = [
        "xisui xiandan",
        "wuji xiandan",
        "tonghui xiandan",
        "zhuyuan xiandan",
        "bless water",
        "ruyi jue",
        "qinglong ya",
    ]
    App.Proposals.Register("quest.san", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.Data.Player.HP["内力上限"] < 8000 || (App.Data.Player.HPM["内力上限"] - App.Data.Player.HP["内力上限"] > 180)) {
            return App.Core.BoxItem.EatLu
        }
        if (App.Data.Player.HP["精力上限"] < 1000 && App.Data.Player.HPM["精力上限"] > 1000) {
            return App.Core.BoxItem.EatWan
        }
        if (App.Data.Player.HP["当前精力"] < App.Data.Player.HP["精力上限"] * 0.9) {
            return function () {
                App.Send("yun refresh;hp")
                $.Insert($.Nobusy())
                $.Next()
            }
        }
        if (San.Data.My) {
            for (let item of imbue_items) {
                if (App.Data.Item.List.FindByIDLower(item).Sum() < 1) {
                    return function () {
                        App.Insert(
                            $.Function(() => {
                                App.Core.BoxItem.TryGet(item)
                            })
                        )
                        App.Next()
                    }
                }
            }
        }
        return null
    }))
    App.Proposals.Register("commonWithQuestSan", App.Proposals.NewProposalGroup("common", "quest.san"))
    class Data {
        constructor(weapon, my) {
            this.Weapon = weapon
            this.My = my
        }
        Weapon = ""
        My = false
    }
    let rule=App.Core.Assets.ParseRule(`#carry id=${imbue_items.join(",")}`)
    let San = {}
    San.GetContext=function(){
        let ctx= {
            NeiliMinNumber:App.Data.Player.HPM["内力上限"] * 0.91,
        }
        ctx[App.Core.Assets.PrepareDataKey]=[rule]
        return ctx
    }
    San.Data = null
    San.Finished = false
    San.Last = 0
    let matcherSomeoneDrop = /^..+丢下一.+$/
    let PlanWait = new App.Plan(App.Positions["Quest"],
        (task) => {
            task.AddTimer(3000)
            task.AddTrigger(matcherSomeoneDrop, () => {
                let now = $.Now()
                if (now - San.Last > 3000) {
                    return false
                }
                return true
            })
        }, (result) => {
            $.Next()
        })
    let matcherMoreHelper = /^你应该先寻求.+位高手协助你先行圣化.+。$/
    let matcherMoreHelper2 = /^你应该再寻求.位高手先行圣化.+。$/
    let matcherImbue = /^现在.+已经被充分的圣化了，需要浸入神物以进一步磨练。$/
    let matcherSan = /^你轻轻抚过.+，两指点于其上，/
    let matcherSanned = /^你已经为.+圣化过了，非凡的能力还无法被它完全吸收。$/
    let matcherSanFinished = /^现在.+的威力已经得到了充分的发挥了。$/
    let matcherSanFinished2 = /^现在.+的潜力已经充分挖掘了，现在只是需要最后一步融合。$/
    let PlanSan = new App.Plan(App.Positions["Response"],
        (task) => {
            if (San.Data.My) {
                task.AddTrigger(matcherMoreHelper).WithName("morehelper")
                task.AddTrigger(matcherMoreHelper2).WithName("morehelper2")
            }
            task.AddTrigger(matcherImbue).WithName("imbue")
            task.AddTrigger(matcherSan).WithName("san")
            task.AddTrigger(matcherSanned).WithName("sanned")
            task.AddTrigger(matcherSanFinished).WithName("sanfinished")
            task.AddTrigger(matcherSanFinished2).WithName("sanfinished2")
            App.Send(`get ${San.Data.Weapon}`)
            App.Send(`san ${San.Data.Weapon};hp;hp -m`)
            App.Sync()
        }, (result) => {
            let needdrop = false
            switch (result.Name) {
                case "sanfinished2":
                    needdrop = true
                case "sanfinished":
                    if (San.Data.My) {
                        San.Finish()
                        return
                    }
                    break
                case "san":
                    needdrop = true
                    $.Insert($.Nobusy())
                    San.Last = $.Now()
                    if (!San.Data.My) {
                        break
                    }
                case "imbue":
                    needdrop = true
                    if (San.Data.My) {
                        $.Append($.Function(() => {
                            for (let item of imbue_items) {
                                App.Send(`imbue ${item} in ${San.Data.Weapon}`)
                            }
                            App.Send(`l ${San.Data.Weapon}`)
                            $.Next()
                        }))
                    }
                    break
                case "morehelper":
                case "morehelper2":
                case "sanned":
                    needdrop = true
                    break
            }
            if (needdrop) {
                $.Append($.Do(`drop ${San.Data.Weapon};i`))
            }
            $.Append(
                $.Nobusy(),
            )
            $.Next()
        })

    San.Go = function () {
        let sanloc = App.Core.Goods.UseBox() ? "home" : "chat"
        $.PushCommands(
            $.Prepare("commonWithQuestSan", San.GetContext()),
            $.To(sanloc),
            $.Plan(PlanWait),
            $.Plan(PlanSan),
            $.Nobusy(),
        )
        App.Next()
    }
    San.Finish = function () {
        San.Finished = true
        $.PushCommands(
            $.Prepare(),
        )
        $.Next()
    }
    let matcherSomeoneImbue = /^.+深吸一口气，面上笼罩了一层白霜，/
    let PlanQuest = new App.Plan(App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherSomeoneImbue, (tri, result) => {
                San.Last = 0
                return true
            })
        })
    let Quest = App.Quests.NewQuest("san")
    Quest.Name = "San"
    Quest.Desc = "圣化兵器"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        San.Go()
    }
    Quest.GetReady = function (q, data) {
        if (San.Finished) {
            return null;
        }
        let weapon, my
        if (data.startsWith("my ")) {
            weapon = data.slice(3)
            my = true
        } else {
            weapon = data
            my = false
        }
        if (weapon) {
            return () => {
                San.Data = new Data(weapon, my)
                Quest.Start(data)
            }
        }
        return null;
    }
    App.Quests.Register(Quest)
    App.Core.Quest.AppendInitor((e) => {
        San.Finished = false
    })
})