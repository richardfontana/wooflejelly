
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
    , error : Maybe String 
    , loading : Bool
    , selectedText : Maybe String
    }


init : () -> ( Model, Cmd Msg )
init _ = 
    ( { diffs = [] 
      , licenseA = "MIT"
      , licenseB = "Apache-2.0"
      , error = Nothing
      , loading = False
      , selectedText = Nothing
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
    | GotError String
    | GotSelectedText String


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model = 
    case msg of
        SelectA id -> 
            ( { model | licenseA = id }, Cmd.none )

        SelectB id ->
            ( { model | licenseB = id }, Cmd.none) 

        RequestDiff ->
            ( { model | error = Nothing }, requestDiff ( model.licenseA, model.licenseB ) )
        
        GotRawJson value -> 
            case Json.Decode.decodeValue (Json.Decode.list diffDecoder) value of 
                Ok diffs -> 
                    ( { model | diffs = diffs, error = Nothing }, Cmd.none )
                Err _ -> 
                    ( { model | error = Just "Decoding failed." }, Cmd.none )

        GotError mesg ->
            ( { model | error = Just mesg, diffs = [] }, Cmd.none )

        GotSelectedText txt -> 
            -- Optionally update a 'selectedText' field in the model for diffing
            ( { model | selectedText = Just txt }, Cmd.none )


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
        , case model.error of 
            Just msg -> 
                div [ style "color" "red" ] [ text ("Error: " ++ msg) ]
            
            Nothing -> 
                div [] (List.map viewDiff model.diffs)        
         
         , case model.selectedText of 
            Just txt ->
                div [] [ text "Selected text:", Html.pre [] [ text txt ] ]          
            
            Nothing -> 
                text ""

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

port receiveDiffError : (String -> msg) -> Sub msg

port receiveSelectedText : (String -> msg) -> Sub msg

port receiveMatchedLicense : (String -> msg) -> Sub msg

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
    Sub.batch 
        [ receiveDiffResult GotRawJson
        , receiveDiffError GotError
        , receiveSelectedText GotSelectedText
        ]
