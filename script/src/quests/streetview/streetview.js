//街景模块
$.Module(function (App) {
    let fixedGroup = {

    }
    let nosleep = {
        "群玉楼雅室": true,
        "土娼馆":true,
    }
    let StreetView = {
        Remain: [],
        StartPoint: "",
        Current: "",
        Count: 0,
    }
    let Quest = App.Quests.NewQuest("streetview")
    Quest.Name = "街景更新"
    Quest.Desc = "街景扫描全地图信息"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        StreetView.Start(data)
    }
    let matcherFill = "这个容器装不了水。"
    let matcherSafe = "这里禁止战斗。"
    let matcherIndoor = "只有在户外才有必要绘制地图。"
    let matcherSleep = "你想和谁做爱？"
    let matcherZone = /^s*【(.+)图】\s*$/
    let PlanLook = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.Data = {
                fill: false,
                safe: false,
                outdoor: true,
                sleep: false,
                Zone: "",
            }
            task.AddTrigger(matcherFill, (tri, result) => {
                task.Data.fill = true
                return true
            })
            task.AddTrigger(matcherSafe, (tri, result) => {
                task.Data.safe = true
                return true
            })
            task.AddTrigger(matcherIndoor, (tri, result) => {
                task.Data.outdoor = false
                return true
            })
            task.AddTrigger(matcherZone, (tri, result) => {
                task.Data.Zone = result[1]
                return true
            })
            task.AddTrigger(matcherSleep, (tri, result) => {
                task.Data.sleep = true
                return true
            })
            let cmd = "yun recover;yun regenerate;fill cloth;hit;show;map here"
            if (!nosleep[App.Map.Room.Name]) {
                cmd += ";makelove"
            }
            App.Look()
            App.Send(cmd)
            App.Sync()
        },
        (result) => {
            print(App.Core.Room.Current.Data.Desc)
            if (StreetView.Current != "") {
                App.Mapper.Database.APITagRoom(StreetView.Current, "室外", result.Task.Data.outdoor ? 1 : 0)
                App.Mapper.Database.APITagRoom(StreetView.Current, "safe", result.Task.Data.safe ? 1 : 0)
                App.Mapper.Database.APITagRoom(StreetView.Current, "sleep", result.Task.Data.sleep ? 1 : 0)
                App.Mapper.Database.APITagRoom(StreetView.Current, "fill", result.Task.Data.fill ? 1 : 0)
                if (App.Core.Room.Current.Data.Desc) {
                    App.Mapper.Database.APITakeSnapshot(StreetView.Current, "desc", App.Core.Room.Current.Data.Desc, "")
                }
                if (result.Task.Data.Zone.endsWith("略") || result.Task.Data.Zone.endsWith("地") || result.Task.Data.Zone.endsWith("概")) {
                    result.Task.Data.Zone = result.Task.Data.Zone.slice(0, -1)
                }
                if (fixedGroup[StreetView.Current]) {
                    result.Task.Data.Zone = fixedGroup[StreetView.Current]
                }
                App.Mapper.Database.APIGroupRoom(StreetView.Current, result.Task.Data.Zone)
            }
            Dump(result.Task.Data)
            $.Next()
        },
    )

    StreetView.Start = (start) => {
        start = start || ""
        start = start.trim()
        StreetView.StartPoint = start
        let rooms = App.Mapper.Database.APIListRooms(App.Mapper.HMM.APIListOption.New())
        rooms.forEach(room => StreetView.Remain.push(room.Key));
        if (start != "") {
            while (StreetView.Remain.length > 0) {
                if (StreetView.Remain[0] == start) {
                    break
                }
                StreetView.Remain.shift()
            }
            Note("继续模式，从 " + start + " 开始。")
        }
        StreetView.Count = StreetView.Remain.length;
        var commands = []
        if (App.Data.Item.List.FindByIDLower("fire").First() == null) {
            commands.push($.Buy("fire"))
        }
        if (App.Data.Item.List.FindByIDLower("long sword").First() == null) {
            commands.push($.Buy("long sword"))
        }
        commands.push($.Function(StreetView.Next))
        App.Commands.PushCommands(...commands)
        App.Next()
    }
    StreetView.Next = () => {
        if (StreetView.Remain.length == 0) {
            StreetView.Finish()
            return
        }
        if (!App.Quests.Stopped) {
            StreetView.Current = StreetView.Remain.shift()
            $.Insert($.Function(StreetView.Next))
            App.Commands.PushCommands(
                $.Function(StreetView.ProcessNext),
            )
        }
        $.Next()
    }
    StreetView.ProcessNext = () => {
        StreetView.StartPoint = "";
        print(`前往 ${StreetView.Current}`)
        App.Commands.PushCommands(
            $.Sync(),
            $.Prepare(),
            $.To(StreetView.Current, App.Map.NewTag("streetview", 1)),
            $.Function(StreetView.Arrive)
        ).WithFailCommand($.Function(StreetView.Fail))
        $.Next()

    }
    StreetView.Fail = () => {
        print(`处理 ${StreetView.Current} 失败`)
        $.Next()
    }
    StreetView.Arrive = () => {
        if (App.Map.Room.ID == StreetView.Current) {
            App.Commands.PushCommands(
                $.Plan(PlanLook)
            )
        }
        $.Next()
    }
    StreetView.Finish = () => {
        Quest.Cooldown(3600)
        App.Log("街景采集完毕")
        App.Tools.HMM.Export()
        App.Next()
    }
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("扫街进度:"),
            new App.HUD.UI.Word(StreetView.Remain.length > 0 ? StreetView.Remain.length: "-", 5, true),
        ]
    }
    Quest.OnReport=function(){
                return [`扫街进度:${StreetView.Remain.length} / ${StreetView.Count}`]
    }
    App.Quests.Register(Quest)
})