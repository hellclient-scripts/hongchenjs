$.Module(function (App) {
    let EatWan = {}
    EatWan.Limit = 0
    EatWan.Start = () => {
        App.Core.BoxItem.EatWan()
    }
    let Quest = App.Quests.NewQuest("eatwan")
    Quest.Name = "吃人参丸"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.GetReady = function (q, data) {
        if (data) {
            EatWan.Limit = parseInt(data.trim())
        } else {
            EatWan.Limit = 0
        }
        if (isNaN(EatWan.Limit) || EatWan.Limit == 0) {
            EatWan.Limit = App.Data.Player.HPM["精力上限"]
        }
        Note(EatWan.Limit)

        if (App.Data.Player.HP["精力上限"] < EatWan.Limit) {
            return () => {
                Quest.Start(data)
            }
        }
        return null
    }

    Quest.Start = function (data) {
        EatWan.Start()
    }
    App.Quests.Register(Quest)

})