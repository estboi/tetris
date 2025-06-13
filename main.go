package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite3", "./scores.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	createTablesIfNotExists()

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	http.HandleFunc("/", IndexHandler)
	http.HandleFunc("/get-scores", GetScoresHandler)
	http.HandleFunc("/submit-score", SubmitScoreHandler)

	fmt.Printf("Starting server at port 8080\n")
	fmt.Printf("http://localhost:8080/\n")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "index.html")
}

func GetScoresHandler(w http.ResponseWriter, r *http.Request) {
	scores := ReadScores()
	scoresJSON, err := json.Marshal(scores)
	if err != nil {
		http.Error(w, "Error encoding JSON", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(scoresJSON)
}

func SubmitScoreHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var score Score
	if err := json.NewDecoder(r.Body).Decode(&score); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	id := 1

	scores := ReadScores()

	for i, player := range scores {
		if player.Score >= score.Score {
			id++
		} else {
			scores[i].ID++
		}
	}
	score.ID = id
	scores = append(scores, score)
	AddScore(id, score.Score, score.Time, score.Name)
	UpdateScores(scores)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(scores)
}
