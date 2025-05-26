
port module Main exposing (main)

import Browser
import Html exposing (Html, div, text, button, span, select, option)
import Html.Attributes exposing (style, selected, value)
import Html.Events exposing (onClick, onInput)
import Json.Decode
import Json.Encode
import Json.Decode as Decode exposing (Value)

-- MODEL

type alias Model = 
    { diffs : List Diff
    , licenseA : String
    , licenseB : String
    }

init : () -> ( Model, Cmd Msg )
init _ = 
    ( { diffs = [] 
      , licenseA = "MIT"
      , licenseB = "Apache-2.0"
      }
    , Cmd.none 
    )

licenseOptions : List String
licenseOptions = 
    [ "MIT"
    , "Apache-2.0"
    , "GPL-3.0-or-later"
    , "BSD-3-Clause"
    , "CC0-1.0"
    ]


-- MESSAGES

type Msg 
    = SelectA String
    | SelectB String
    | RequestDiff
    | GotRawJson Json.Decode.Value


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model = 
    case msg of
        SelectA id -> 
            ( { model | licenseA = id }, Cmd.none )

        SelectB id ->
            ( { model | licenseB = id }, Cmd.none) 

        RequestDiff ->
            ( model, requestDiff ( model.licenseA, model.licenseB ) )
        
        GotRawJson value -> 
            case Json.Decode.decodeValue (Json.Decode.list diffDecoder) value of 
                Ok diffs -> 
                    ( { model | diffs = diffs }, Cmd.none )
                Err err -> 
                    ( model, Cmd.none )


-- VIEW

view : Model -> Html Msg
view model = 
    div [] 
        [ div [] 
            [ text "License A: "
            , viewSelect SelectA model.licenseA
            ]
        , div []
            [ text "License B: "
            , viewSelect SelectB model.licenseB
            ]
        , button [ onClick RequestDiff ] [ text "Run Diff" ]
        , div [] (List.map viewDiff model.diffs)
        ]   

viewDiff : Diff -> Html msg
viewDiff diff =
    case diff of
        Equal txt ->
            span [] [ text txt ]

        Insert txt ->
            span [ style "background-color" "#dfd" ] [ text txt ]

        Delete txt ->
            span [ style "background-color" "#fdd", style "text-decoration" "line-through" ] [ text txt ]


viewSelect : (String -> Msg) -> String -> Html Msg
viewSelect msgConstructor selectedValue = 
    Html.select 
        [ Html.Events.onInput msgConstructor ]
        ( List.map (viewOption selectedValue) licenseOptions)  

viewOption : String -> String -> Html Msg
viewOption selected current = 
    Html.option 
        [ Html.Attributes.value current
        , Html.Attributes.selected (current == selected)
        ]
        [ text current ]

-- MAIN

main : Program () Model Msg
main = 
    Browser.element
        { init = init
        , view = view 
        , update = update
        , subscriptions = subscriptions
        }


-- PORTS

port requestDiff : ( ( String, String ) -> Cmd msg )

port receiveDiffResult : (Json.Decode.Value -> msg) -> Sub msg

type Diff
    = Equal String
    | Insert String
    | Delete String


diffDecoder : Json.Decode.Decoder Diff
diffDecoder =
    Json.Decode.map2 makeDiff
        (Json.Decode.field "op" Json.Decode.string)
        (Json.Decode.field "text" Json.Decode.string)


makeDiff : String -> String -> Diff
makeDiff op text =
    case op of
        "equal" -> Equal text
        "insert" -> Insert text
        "delete" -> Delete text
        _ -> Equal text -- fallback

subscriptions : Model -> Sub Msg
subscriptions _ = 
    receiveDiffResult GotRawJson

