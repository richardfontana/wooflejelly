-- Copyright The Wooflejelly Authors
-- SPDX-License-Identifier: Apache-2.0

port module Main exposing (main)

import Browser
import Html exposing (Html, div, text, button, span)
import Html.Attributes exposing (style)
import Html.Events exposing (onClick)
import Json.Decode
import Json.Encode
import Json.Decode as Decode exposing (Value)

-- MODEL

type alias Model = 
    { diffs : List Diff }

init : () -> ( Model, Cmd Msg )
init _ = 
    ( { diffs = [] }, Cmd.none )


-- MESSAGES

type Msg 
    = RequestDiff
    | GotRawJson Json.Decode.Value
    | GotDiff (List Diff)


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model = 
    case msg of
        RequestDiff ->
            ( model, requestDiff () )
        GotRawJson value -> 
            case Json.Decode.decodeValue (Json.Decode.list diffDecoder) value of 
                Ok diffs -> 
                    Debug.log "Decoded diffs" ( { model | diffs = diffs }, Cmd.none )
                Err err -> 
                    Debug.log "Decode error" ( model, Cmd.none )
        GotDiff _ ->
            ( model, Cmd.none )


-- VIEW

view : Model -> Html Msg
view model = 
    div [] 
        [ button [ onClick RequestDiff ] [ text "Run Diff" ]
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

port requestDiff : () -> Cmd msg

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

