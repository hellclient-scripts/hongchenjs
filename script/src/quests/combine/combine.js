$.Module(function (App) {
    class PartItem {
        constructor(key, count) {
            this.Key = key
            this.Count = count
            this.BoxInfo = App.Core.BoxItem.Items[key]
        }
        GetCombineCommands() {
            let result = []
            for (let i = 0; i < this.Count; i++) {
                result.push(`${this.BoxInfo.ID} ${i + 1}`)
            }
            return result
        }
        Key = ""
        Count = 1
        BoxKey = ""
        BoxCount = 0
    }
    class Item {
        Key = ""
        Parts = []
    }
    let Combine = {}
    Combine.Current = 0
    Combine.Target = 0
    Combine.Fail = false
    Combine.Items = {}
    Combine.Object = null
    App.Proposals.Register("quest.combine", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.Data.Player.HP["精力上限"] < 300) {
            return App.Core.BoxItem.EatWan
        }
        if (App.Data.Player.HP["当前精力"] < 300) {
            return function () {
                App.Send("yun refresh;hp")
                $.Insert($.Nobusy())
                $.Next()
            }
        }
        return null
    }))
    App.Proposals.Register("commonWithQuestCombine", App.Proposals.NewProposalGroup("common", "quest.combine"))

    Combine.Next = function () {
        $.PushCommands(
            $.Prepare("commonWithQuestFuse"),
            $.Function(App.Core.Item.CheckBox),
            $.Function(Combine.Check),
            $.Prepare(),
        )
        App.Next()
    }
    Combine.Check = function () {
        let parts = []
        for (let i = 0; i < Combine.Object.Parts.length; i++) {
            let partitem = null
            for (let j = 0; j < Combine.Object.Parts[i].length; j++) {
                let item = Combine.Object.Parts[i][j]
                let boxitem = App.Data.Box.List.FindByID(item.BoxInfo.DisplayID).First()
                if (boxitem == null) {
                    continue
                }
                if (partitem == null || boxitem.GetData().Count > partitem.BoxCount) {
                    partitem = item
                    partitem.BoxCount = boxitem.GetData().Count
                    partitem.BoxKey = boxitem.Key
                }
            }
            if (partitem == null) {
                Note(`道具不足`)
                Combine.Fail = true
                App.Next()
                return
            }
            parts.push(partitem)
        }
        parts.sort((a, b) => a.BoxKey > b.BoxKey ? -1 : 1)
        let cmd = parts.map(p => `take ${p.BoxKey} ${p.Count}`).join(";")
        App.Send(cmd)
        let combinecmd = "combine " + parts.map(p => p.GetCombineCommands().join(" & ")).join(" & ")
        App.Send(combinecmd, false, true)
        App.Send("hp;i")
        App.Insert($.Nobusy())
        $.Next()
    }
    App.LoadLines("src/quests/combine/data.txt", "|").forEach((data) => {
        let item = new Item()
        item.Key = data[0]
        for (let i = 1; i < data.length; i++) {
            let d = data[i].trim().split(",")
            let part = []
            for (let di = 0; di < d.length; di++) {
                let pi = SplitN(d[di], ":", 2)
                part.push(new PartItem(pi[0], pi[1] ? pi[1] : 1))
            }
            item.Parts.push(part)
        }
        Combine.Items[item.Key] = item
    })

    Combine.Current = 0
    Combine.Target = 0
    Combine.Fail = false

    let Quest = App.Quests.NewQuest("combine")
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("合成:"),
            new App.HUD.UI.Word(`${Combine.Current}/${Combine.Target}`, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("合"),
            new App.HUD.UI.Word(`${Combine.Current}/${Combine.Target}`, 5, true),
        ]
    }
    Quest.OnReport = () => {
        return [`溶化进度 ${Combine.Current}/${Combine.Target}`]
    }
    Quest.Name = "合成"
    Quest.Desc = "合成物品,请不要再一个队列里合成多个物品"
    Quest.Intro = ""
    Quest.Help = ""
    //你通过合成乾坤圣水的历练过程，从而获得了一百点灵慧。
    let matcherCombine = /^你通过合成.+的历练过程，从而获得了.+灵慧。$/
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherCombine, function () {
                Combine.Current++
                Note(`合成成功 ${Combine.Current}/${Combine.Target}`)
                return true
            })
        }
    )

    Quest.Start = function (data) {
        PlanQuest.Execute()
        Combine.Next()
    }
    Quest.GetReady = function (q, data) {
        let item = SplitN(data, " ", 2)
        Combine.Object = Combine.Items[item[0]]
        Combine.Target = item[1] ? item[1] - 0 : 0
        if (Combine.Object == null || !(Combine.Current < Combine.Target) || Combine.Fail || App.Quests.Stopped) {
            return null
        }
        return () => { Quest.Start(data) }
    }
    App.Quests.Register(Quest)
    App.Quests.Combine = Combine
    App.Core.Quest.AppendInitor(() => {
        Combine.Target = 0
        Combine.Current = 0
        Combine.Fail = false
        Combine.Object = null
    })
})