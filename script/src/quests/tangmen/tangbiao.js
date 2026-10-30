//要镖模块
$.Module(function (App) {
    let TangBiao = {}
    const BiaoID = "qizi gangbiao"
    TangBiao.Max = 9000
    TangBiao.Start = () => {
        $.PushCommands(
            $.Prepare(),
            $.Function(App.Core.Item.CheckBox),
            $.Function(TangBiao.Check),
        )
        App.Next()
    }
    TangBiao.Check = () => {
        let boxitem = App.Data.Box.List.FindByIDLower(BiaoID).First()
        let count = boxitem ? boxitem.GetData().Count : 0
        if (count >= TangBiao.Max) {
            Quest.Cooldown(3600 * 1000)
            App.Next();
            return
        }
        let commands = [
            $.To("tang biao")
        ];
        for (var i = 0; i < 5; i++) {
            commands.push($.Do("yun regenerate"))
            for (var j = 0; j < 10; j++) {
                commands.push($.Do("ask tang biao about 暗器"))
            }
            commands.push($.Do("i"))
            commands.push($.Nobusy())
        }
        commands.push($.To("home"))
        commands.push($.Function(() => {
            var buff = 0
            var count = App.Data.Item.List.FindByID(BiaoID).Sum()
            $.Insert($.Do("i"))
            for (var i = 0; i < count; i++) {
                $.Insert($.Do("cun " + BiaoID))
                buff += 1
                if (buff >= 10) {
                    $.Insert($.Nobusy())
                    buff = 0
                }
            }
            App.Next()
        }))
        $.Insert(...commands);
        App.Next()
    }
    let Quest = App.Quests.NewQuest("tangbiao")
    Quest.Name = "要镖"
    Quest.Desc = "唐门要镖"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.GetReady = function (q, data) {
        let max = parseInt(data)
        if (isNaN(max)) {
            max = 9000
        }
        TangBiao.Max = max
        return () => {
            Quest.Start()
        }
    }

    Quest.Start = function () {
        TangBiao.Start()
    }
    App.Quests.Register(Quest)
})