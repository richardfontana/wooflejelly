-- Copyright The Wooflejelly Authors
-- SPDX-License-Identifier: Apache-2.0

port module Main exposing (main)

import Browser
import Html exposing (Html, div, text, button)
import Html.Events exposing (onClick)
import Json.Encode exposing (string)

type alias Model = 
    { count : Int }

type Msg 
    = Increment
    | SendToJS

main : Program () Model Msg
main = 
    Browser.element
        { init = \_ -> ( { count = 0 }, Cmd.none )
        , view = view 
        , update = update
        , subscriptions = \_ -> Sub.none
        }

view : Model -> Html Msg
view model =
    div []
        [ text ("Count: " ++ String.fromInt model.count)
        , button [ onClick Increment ] [ text "+" ]
        , button [ onClick SendToJS ] [ text "Send to JS" ]
        ]

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of 
        Increment -> 
            ( { model | count = model.count + 1 }, Cmd.none )
        SendToJS ->
            ( model, sendToJS ("Count is " ++ String.fromInt model.count) ) 

port sendToJS : String -> Cmd msg
