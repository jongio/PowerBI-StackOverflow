CREATE VIEW [dbo].questions_by_month AS
SELECT CONVERT(nvarchar(20), DATEPART(Year, creation_date)) + '-' + CONVERT(nvarchar(20), DATEPART(Month, creation_date)) as [date], count(question_id) as total
FROM questions
GROUP BY DATEPART(Year, creation_date), DATEPART(Month, creation_date)