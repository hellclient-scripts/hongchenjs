//发呆模块
$.Module(function (App) {
    let Quest = App.Quests.NewQuest("stab")

    let Stab = {}
    Stab.List = []
    Stab.Start = (data) => {
        Stab.List = [...App.Core.Miss.Weapons]
        App.Core.Miss.Mode = App.Core.Miss.ModeNeedStab
        Stab.Next()
    }
    Stab.Next = () => {
        if (Stab.List.length == 0) {
            Note("插10lv完成")
            App.Core.Miss.Mode = App.Core.Miss.ModeNormal
            Quest.Cooldown(3600)
            $.Next()
            return
        }
        let weapon = Stab.List.shift()
        print(`插10lv ${weapon.ID}`)
        App.Commands.PushCommands(
            $.Prepare(),
            $.To(weapon.Loc),
            $.Sync(),
            $.Do(`summon ${weapon.ID}`),
            $.Do(`stab ${weapon.ID}`),
            $.Nobusy(),
            $.Function(Stab.Next)
        )
        $.Next()
    }
    Quest.Name = "插10lv"
    Quest.Desc = "根据miss_list变量的设置，插10lv以便miss"
    Quest.Intro = ""
    Quest.Help = ""

    Quest.Start = function (data) {
        Stab.Start(data)
    }
    App.Quests.Register(Quest)
})