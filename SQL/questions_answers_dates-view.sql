CREATE VIEW [dbo].question_answer_dates
	AS SELECT question_id, DATEDIFF(hh, creation_date, first_answer_creation_date) AS hours_to_respond, creation_date, first_answer_creation_date FROM questions WHERE first_answer_creation_date IS NOT NULL;
