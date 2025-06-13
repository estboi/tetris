package main

import (
	"log"
)

type Score struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Score int    `json:"score"`
	Time  string `json:"time"`
}

func createTablesIfNotExists() {
	statement, _ := db.Prepare(`CREATE TABLE IF NOT EXISTS userScore (id INTEGER, name TEXT, score INTEGER , time TEXT)`)
	statement.Exec()
}

func ReadScores() []Score {
	scoreList := []Score{}
	rows, err := db.Query("SELECT id, name, score, time FROM userScore")
	if err != nil {
		log.Println("Reading score issue: ", err)
	}
	for rows.Next() {
		score := Score{}
		err = rows.Scan(
			&score.ID,
			&score.Name,
			&score.Score,
			&score.Time,
		)
		if err != nil {
			log.Println("Reading score row issue: ", err)
		}
		scoreList = append(scoreList, score)
	}
	return scoreList
}

func AddScore(id, score int, time, name string) {
	_, err := db.Exec("INSERT INTO userScore(id, name, score, time) VALUES (?, ?, ?, ?)", id, name, score, time)
	if err != nil {
		log.Println("Writing score issue: ", err)
	}
}

func UpdateScores(scores []Score) {
	// Delete all existing scores
	_, err := db.Exec("DELETE FROM userScore")
	if err != nil {
		log.Println("Deleting scores issue: ", err)
		return
	}

	// Insert the new scores
	for _, score := range scores {
		AddScore(score.ID, score.Score, score.Time, score.Name)
	}
}
