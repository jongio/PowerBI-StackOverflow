SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].questions_upsert
	@question_id int,
	@link nvarchar(max),
	@title nvarchar(max),
	@creation_date datetime,
	@last_activity_date datetime,
	@first_answer_creation_date datetime = null,
	@score int = 0,
	@answer_count int = 0,
	@view_count int = 0,
	@is_answered int = 0
AS
	IF EXISTS (SELECT 1 FROM questions WHERE question_id = @question_id)
		BEGIN
			UPDATE questions
			SET link = @link,
				title = @title,
				creation_date = @creation_date,
				last_activity_date = @last_activity_date,
				first_answer_creation_date = @first_answer_creation_date,
				score = @score,
				answer_count = @answer_count,
				view_count = @view_count,
				is_answered = @is_answered
			WHERE question_id = @question_id
		END
	ELSE
		BEGIN
			INSERT INTO questions (question_id, link, title, creation_date, last_activity_date, first_answer_creation_date, score, answer_count, view_count, is_answered)
			VALUES (@question_id, @link, @title, @creation_date, @last_activity_date, @first_answer_creation_date, @score, @answer_count, @view_count, @is_answered)
		END