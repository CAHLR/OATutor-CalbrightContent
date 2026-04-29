import {
  buildLessonConfirmationPath,
  buildLessonLaunchPath,
  buildLessonPath,
  CONFIRMATION_MODES,
  getConfirmationModeForLesson,
  resolveLessonContext,
} from "./lessonFlow";

describe("lessonFlow", () => {
  const sharedLessonId = "1cSXQ5Df-5PHn-jeatrYLxjl";

  it("resolves duplicate lesson ids against the selected section", () => {
    expect(
      getConfirmationModeForLesson(sharedLessonId, { courseNum: "0" })
    ).toBe(CONFIRMATION_MODES.NONE);
    expect(
      getConfirmationModeForLesson(sharedLessonId, { courseNum: "1" })
    ).toBe(CONFIRMATION_MODES.GENERIC);
    expect(
      getConfirmationModeForLesson(sharedLessonId, { courseNum: "2" })
    ).toBe(CONFIRMATION_MODES.PERSONALIZED);
  });

  it("prefers explicit confirmationMode over duplicate lesson-id lookup", () => {
    expect(
      getConfirmationModeForLesson(sharedLessonId, {
        confirmationMode: "generic",
      })
    ).toBe(CONFIRMATION_MODES.GENERIC);
  });

  it("can resolve by course name from the LTI payload", () => {
    const lesson = resolveLessonContext(sharedLessonId, {
      courseName: "Section 3 ",
    }).lesson;

    expect(lesson?.confirmationMode).toBe(CONFIRMATION_MODES.PERSONALIZED);
    expect(lesson?.courseName).toBe("Section 3 ");
  });

  it("builds the correct launch path for each section mode", () => {
    expect(
      buildLessonLaunchPath({
        lessonId: sharedLessonId,
        courseNum: "0",
      })
    ).toBe(buildLessonPath({ lessonId: sharedLessonId }));

    expect(
      buildLessonLaunchPath({
        lessonId: sharedLessonId,
        courseNum: "1",
      })
    ).toBe(
      buildLessonConfirmationPath({
        lessonId: sharedLessonId,
        courseNum: "1",
      })
    );
  });
});
