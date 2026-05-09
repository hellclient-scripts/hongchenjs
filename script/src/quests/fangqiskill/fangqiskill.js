$.Module(function (App) {
    class FangqiData {
        constructor(skills) {
            this.All = skills.length
            this.Remain = skills
        }
    }
    let FangqiSkill = {}
    FangqiSkill.Data = null
    FangqiSkill.Protected = {}
    App.LoadLines("src/quests/fangqiskill/protected.txt", "|").forEach((data) => {
        FangqiSkill.Protected[data] = true
    })
    FangqiSkill.Next = function () {
        FangqiSkill.Data.Remain = FangqiSkill.Data.Remain.filter((skill) => {
            if (App.Data.Player.Skills[skill] == null) {
                return false
            }
            if (FangqiSkill.Protected[skill]) {
                return false
            }
            return true
        })
        if (FangqiSkill.Data.Remain.length != 0) {
            $.PushCommands(
                $.To("chat"),
                $.Do(`fangqi ${FangqiSkill.Data.Remain[0]}`),
                $.Do("jifa;hp;hp -m;cha"),
                $.Nobusy()
            )
        } else {
            $.PushCommands(
                $.Nobusy()
            )
        }
        $.Next()
    }

    let Quest = App.Quests.NewQuest("fangqiskill")
    Quest.OnHUD = () => {
        if (FangqiSkill != null) {
            return [
                new App.HUD.UI.Word("放弃:"),
                new App.HUD.UI.Word(`${FangqiSkill.Data.All - FangqiSkill.Data.Remain.length}/${FangqiSkill.Data.All}`, 5, true),
            ]
        }
    }
    Quest.OnSummary = () => {
        if (FangqiSkill != null) {
            return [
                new App.HUD.UI.Word("放"),
                new App.HUD.UI.Word(`${FangqiSkill.Data.All - FangqiSkill.Data.Remain.length}/${FangqiSkill.Data.All}`, 5, true),
            ]
        }
    }
    Quest.OnReport = () => {
        if (FangqiSkill != null) {
            return [`放弃进度 ${FangqiSkill.Data.All - FangqiSkill.Data.Remain.length}/${FangqiSkill.Data.All}  ${FangqiSkill.Data.Remain.join(",")}`]
        }
    }
    Quest.Name = "放弃技能"
    Quest.Desc = "放弃技能，放弃不需要的技能，请通过#fangqi 通过UI选择"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        FangqiSkill.Next()
    }
    Quest.GetReady = function (q, data) {
        if (FangqiSkill.Data == null) {
            dataobj = JSON.parse(data)
            if (dataobj.SkillsToFangqi != null && dataobj.SkillsToFangqi instanceof Array) {
                FangqiSkill.Data = new FangqiData(dataobj.SkillsToFangqi)
            } else {
                FangqiSkill.Data = new FangqiData([])
            }
        }
        if (FangqiSkill.Data.Remain.length == 0) {
            return null
        }
        return () => { Quest.Start(data) }
    }
    App.Quests.Register(Quest)
    App.Quests.FangqiSkill = FangqiSkill
    App.Core.Quest.AppendInitor(() => {
        FangqiSkill.Data = null
    })
})