-- Copyright The Wooflejelly Authors
-- SPDX-License-Identifier: Apache-2.0

port module Main exposing (main)

import Browser
import Html exposing (Html, div, text, button)
import Html.Events exposing (onClick)
import Json.Decode

-- MODEL

type alias Model = 
    { diffHtml : String }

init : () -> ( Model, Cmd Msg )
init _ = 
    ( { diffHtml = "" }, Cmd.none )


-- MESSAGES

type Msg 
    = RequestDiff
    | GotDiff String


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model = 
    case msg of
        RequestDiff ->
            ( model, requestDiff () )

        GotDiff html ->
            ( { model | diffHtml = html }, Cmd.none )


-- VIEW

view : Model -> Html Msg
view model = 
    div [] 
        [ button [ onClick RequestDiff ] [ text "Run Diff" ]
        , Html.pre [] [ text model.diffHtml ] 
        ]   


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

port receiveDiffResult : (String -> msg) -> Sub msg

subscriptions : Model -> Sub Msg
subscriptions _ = 
    receiveDiffResult GotDiff

