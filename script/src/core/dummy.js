(function (App) {
    App.Core.Dummy = {}
    App.Core.Dummy.ID = ""
    App.Core.Dummy.Password = ""
    App.Core.Dummy.Load = function () {
        App.Core.Dummy.ID = ""
        App.Core.Dummy.Password = ""
        let data = GetVariable("house_dummy").trim() || App.Core.Params.Shared.Dummy.trim()
        if (data) {
            if (data.indexOf("\n") >= 0) {
                PrintSystem("大米变量格式错误,应该为单行的 dummyid dummy密码")
                return
            }
            let w = data.split(" ")
            if (w[0] == "") {
                PrintSystem("大米变量格式错误,大米ID不可为空")
                return
            }
            App.Core.Dummy.ID = w[0]
            App.Core.Dummy.Password = (w.length > 1) ? App.Core.Dummy.Password = w[1] : ""
        }
        if (App.Core.Dummy.ID) {
            if (App.Core.Dummy.Password == "") {
                Note(`大米ID:${App.Core.Dummy.ID},未设置密码`)
            } else {
                Note(`大米ID:${App.Core.Dummy.ID},已设置密码`)
            }
        } else {
            Note("未指定大米")
        }
    }
    App.Core.Dummy.Load()
    App.Sender.RegisterAlias("#enterchatroom", function (data) {
        if (App.Core.Dummy.ID) {
            if (App.Core.Dummy.ID == GetVariable("id").trim()) {
                App.Send("newchat")
            }
            App.Send(`enter ${App.Core.Dummy.ID}`)
        } else {
            App.Send("mcenter0")
        }
    })
    App.Engine.SetFilter("core.dummy.retry", function (event) {
        App.RaiseEvent(event)
    })
    App.Proposals.Register("key", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.Mapper.HouseID && App.Core.Dummy.ID && App.Core.Dummy.Password && !App.Core.Goods.NoBox) {
            if (App.Data.Item.List.FindByID("key").First() == null) {
                return function () {
                    if (App.Core.Dummy.ID == GetVariable("id").trim()) {

                        Note("找鲁班要钥匙")
                        $.PushCommands(
                            $.To("qz"),
                            $.Do("qu 10 silver"),
                            $.Nobusy(),
                            $.To("lu ban"),
                            $.Do("ask lu ban about key;give 10 silver to lu ban;i")
                        )
                    } else {
                        Note("找大米要钥匙")
                        $.PushCommands(
                            $.To("chat"),
                            $.Nobusy(),
                            $.Do(`give 1 gold to ${App.Core.Dummy.ID};tell ${App.Core.Dummy.ID} key ${App.Core.Dummy.Password}`),
                            $.Wait(10000),
                            $.Do("i"),
                            $.Sync()
                        )
                    }
                    $.Next()
                }
            }
        }
        return null
    }))

})(App)