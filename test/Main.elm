port module Main exposing (main)

import Browser
import Html exposing (Html, div, text, button)
import Html.Events exposing (onClick)
import Json.Encode exposing (string)


-- MODEL

type alias Model =
    { count : Int }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { count = 0 }, Cmd.none )


-- MESSAGES

type Msg
    = Increment
    | SendToJS


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }, Cmd.none )

        SendToJS ->
            ( model, sendToJS ("Count is " ++ String.fromInt model.count) )


-- VIEW

view : Model -> Html Msg
view model =
    div []
        [ text ("Count: " ++ String.fromInt model.count)
        , button [ onClick Increment ] [ text "+" ]
        , button [ onClick SendToJS ] [ text "Send to JS" ]
        ]


-- MAIN

main : Program () Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        }


-- PORTS

port sendToJS : String -> Cmd msg

