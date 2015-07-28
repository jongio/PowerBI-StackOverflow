SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[questions] (
    [question_id]                INT            NOT NULL,
    [link]                       NVARCHAR (MAX) NULL,
    [title]                      NVARCHAR (MAX) NULL,
    [creation_date]              DATETIME       NULL,
    [last_activity_date]         DATETIME       NULL,
    [score]                      INT            NULL,
    [answer_count]               INT            NULL,
    [view_count]                 INT            NULL,
    [is_answered]                BIT            NULL,
    [first_answer_creation_date] DATETIME       NULL
);