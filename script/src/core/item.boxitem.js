(function (App) {
    App.Core.BoxItem = {}
    App.Core.BoxItem.Items = {}
    class BoxItem {
        Key = "";
        Label = "";
        DisplayID = "";
        ID = "";
        Stackable = false;
    }
    App.LoadLines("data/boxitem.txt", "|").forEach(e => {
        let item = new BoxItem()
        item.Key = e[0]
        item.Label = e[1]
        item.DisplayID = e[2]
        item.ID = e[3]
        item.Stackable = e[4] == "t"
        App.Core.BoxItem.Items[item.Key] = item
    });
    App.Core.BoxItem.TryGet = function (key) {
        let item = App.Core.BoxItem.Items[key]
        if (item == null) {
            App.Log(`未登记的箱子物品 ${key}`)
            return
        }
        if (App.Data.Item.List.FindByID("key").First() != null && App.Mapper.HouseID && !App.Core.Goods.NoBox) {
            $.PushCommands(
                $.To("home"),
                $.Nobusy(),
                $.Function(App.Core.Item.CheckBox),
                $.Function(() => {
                    let boxitem = App.Data.Box.List.FindByID(item.DisplayID).First()
                    if (boxitem == null) {
                        Note(`箱子里没有${item.DisplayID}了`)
                    } else {
                        App.Send(`take ${boxitem.Key} 1;i`)
                    }
                    $.Next()
                }),
                App.NewNobusyCommand(),
            )
        } else {
            let cmd = item.Stackable ? `get 1 ${item.ID} ;i` : `get ${item.ID};i`
            $.PushCommands(
                $.To("chat"),
                $.Nobusy(),
                $.Do(cmd),
                $.Nobusy(),
            )
        }
        $.Next()
    }
    App.Core.BoxItem.LastWan = 0
    App.Core.BoxItem.LastWanDelay = 30 * 60 * 1000
    App.Core.BoxItem.CanEatWan = function () {
        return (new Date()).getTime() - App.Core.BoxItem.LastWan > App.Core.BoxItem.LastWanDelay
    }
    App.Core.BoxItem.EatWan = function () {
        $.PushCommands(
            $.Function(() => {
                App.Core.BoxItem.TryGet("renshen wan")
            }),
            $.Function(() => {
                if (App.Data.Item.List.FindByID("renshen wan").First() != null) {
                    App.Send("eat renshen wan;i;hp -m;hp")
                    $.Insert($.Nobusy())
                } else {
                    App.Log("没renshen wan了")
                }
                $.Next()
            })
        )
        $.Next()
    }

    App.Core.BoxItem.LastLu = 0
    App.Core.BoxItem.LastLuDelay = 30 * 60 * 1000
    App.Core.BoxItem.CanEatLu = function () {
        return (new Date()).getTime() - App.Core.BoxItem.LastLu > App.Core.BoxItem.LastLuDelay
    }
    App.Core.BoxItem.Eatlu = function () {
        $.PushCommands(
            $.Function(() => {
                App.Core.BoxItem.TryGet("magic water")
            }),
            $.Function(() => {
                if (App.Data.Item.List.FindByID("magic water").First() != null) {
                    App.Send("eat magic water;i;hp -m;hp")
                    $.Insert($.Nobusy())
                } else {
                    App.Log("没magic water了")
                }
                $.Next()
            })
        )
        $.Next()
    }
    App.Proposals.Register("eatlu", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.PolicyParams["eatlu"] > 0 && App.Data.Player.HP["内力上限"] < App.PolicyParams["eatlu"] && (App.Data.Player.HPM["内力上限"] - App.Data.Player.HP["内力上限"]) >= 180 && App.Core.BoxItem.CanEatLu()) {
            return App.Core.BoxItem.Eatlu
        }
        return null
    }))
})(App)