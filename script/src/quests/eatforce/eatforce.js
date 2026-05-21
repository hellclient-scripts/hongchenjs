$.Module(function (App) {
    let EatForce = {}
    EatForce.Limit = 0
    EatForce.Start = () => {
        App.Core.BoxItem.EatLu()
    }
    let Quest = App.Quests.NewQuest("eatforce")
    Quest.Name = "吃内功等级"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.GetReady = function (q, data) {
        if (data) {
            EatForce.Limit = parseInt(data.trim())
        } else {
            EatForce.Limit = 0
        }
        if (isNaN(EatForce.Limit) || EatForce.Limit == 0) {
            return null
        }
        let level = App.Core.Player.GetSkillLevelByJifa("force")
        if (level > 0 && level < EatForce.Limit && level < App.Data.Player.HPM["当前等级"]) {
            return () => {
                Quest.Start(data)
            }
        }
        return null
    }

    Quest.Start = function (data) {
        EatForce.Start()
    }
    App.Quests.Register(Quest)

})