port module Elm.Main exposing (main)

import Browser
import Html exposing (Html, button, div, text)
import Html.Events exposing (onClick)
import Html.Attributes exposing (style)
import Json.Decode as Decode exposing (Decoder)

-- MAIN

main : Program () Model Msg
main =
    Browser.element
        { init = \_ -> ( initialModel, Cmd.none )
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


-- MODEL

type alias Model =
    { candidates : List DiffCandidate
    , selectedLicenseId : Maybe String
    }

initialModel : Model
initialModel =
    { candidates = []
    , selectedLicenseId = Nothing
    }


-- TYPES

type alias DiffCandidate =
    { licenseId : String
    , score : Float
    }


-- MESSAGES

type Msg
    = GotDiffCandidates (List DiffCandidate)
    | SelectCandidate String


-- UPDATE

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotDiffCandidates candidates ->
            ( { model | candidates = candidates }, Cmd.none )

        SelectCandidate licenseId ->
            ( { model | selectedLicenseId = Just licenseId }
            , requestDiffFor licenseId
            )


-- VIEW

view : Model -> Html Msg
view model =
    div []
        [ div [] 
            [ text "Top License Matches:" ]
        , div []
            (List.map viewCandidate model.candidates)
        , case model.selectedLicenseId of
            Just id -> 
                div [ style "margin-top" "1em" ]
                    [ text ("Selected: " ++ id) ]

            Nothing ->
                text ""
         ]

viewCandidate : DiffCandidate -> Html Msg
viewCandidate candidate =
    button 
        [ onClick (SelectCandidate candidate.licenseId) 
        , style "display" "block"
        , style "margin"  "0.5em 0"
        ]
        [ text (candidate.licenseId ++ " (score: " ++ String.fromFloat candidate.score ++ ")") ]


-- PORTS

port receiveDiffCandidates : (Decode.Value -> msg) -> Sub msg

port requestDiffFor : String -> Cmd msg

-- DECODERS

decodeCandidate : Decoder DiffCandidate
decodeCandidate =
    Decode.map2 DiffCandidate
        (Decode.field "licenseId" Decode.string)
        (Decode.field "score" Decode.float)

decodeCandidateList : Decoder (List DiffCandidate)
decodeCandidateList =
    Decode.list decodeCandidate


-- SUBSCRIPTIONS

subscriptions : Model -> Sub Msg
subscriptions model =
    receiveDiffCandidates
        (\value ->
            case Decode.decodeValue decodeCandidateList value of
                Ok candidates ->
                    GotDiffCandidates candidates

                Err _ ->
                    GotDiffCandidates [] -- fallback error handling
        )
        
