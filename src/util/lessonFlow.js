import {
  coursePlans,
  findLessonById,
} from "../config/config.js";

export const CONFIRMATION_MODES = Object.freeze({
  NONE: "none",
  GENERIC: "generic",
  PERSONALIZED: "personalized",
});

const VALID_CONFIRMATION_MODES = new Set(Object.values(CONFIRMATION_MODES));

const normalizeCourseName = (courseName) =>
  typeof courseName === "string" ? courseName.trim().toLowerCase() : "";

export const normalizeConfirmationMode = (confirmationMode) => {
  if (typeof confirmationMode !== "string") return null;
  const normalized = confirmationMode.trim().toLowerCase();
  return VALID_CONFIRMATION_MODES.has(normalized) ? normalized : null;
};

export const normalizeSearch = (search = "") => {
  if (!search) return "";
  return search.startsWith("?") ? search : `?${search}`;
};

export const findCourseByNum = (courseNum) => {
  if (courseNum == null || courseNum === "") return null;
  const parsed = Number(courseNum);
  if (!Number.isInteger(parsed)) return null;
  return coursePlans[parsed] || null;
};

export const findCourseByName = (courseName) => {
  const normalizedTarget = normalizeCourseName(courseName);
  if (!normalizedTarget) return null;

  return (
    coursePlans.find(
      (course) => normalizeCourseName(course.courseName) === normalizedTarget
    ) || null
  );
};

// Canonical course label for logging (the "Content" column). Exact-match the Canvas course
// title against the course plans (same contract the LTI middleware uses), and fall back to the
// raw Canvas title so a name mismatch is recorded truthfully — never silently collapsed to the
// first course. Count-agnostic and free of hardcoded section names.
export const resolveContentName = (canvasCourseName) =>
  findCourseByName(canvasCourseName)?.courseName || canvasCourseName || "n/a";

export const findCourseForLesson = (lessonId, options = {}) => {
  const { courseNum, courseName } = options;

  return (
    findCourseByNum(courseNum) ||
    findCourseByName(courseName) ||
    coursePlans.find((course) =>
      course.lessons?.some((lesson) => lesson.id === lessonId)
    ) ||
    null
  );
};

const decorateLesson = (lesson, course, confirmationModeOverride = null) => {
  if (!lesson) return null;
  if (!course) {
    return confirmationModeOverride
      ? {
          ...lesson,
          confirmationMode: confirmationModeOverride,
        }
      : lesson;
  }

  return {
    ...lesson,
    courseName: course.courseName,
    courseOER: course.courseOER != null ? course.courseOER : "",
    courseLicense: course.courseLicense != null ? course.courseLicense : "",
    confirmationMode:
      confirmationModeOverride ||
      course.confirmationMode ||
      CONFIRMATION_MODES.PERSONALIZED,
  };
};

export const resolveLessonContext = (lessonId, options = {}) => {
  const explicitMode = normalizeConfirmationMode(options.confirmationMode);
  const course = findCourseForLesson(lessonId, options);
  const courseLesson = course?.lessons?.find((lesson) => lesson.id === lessonId);

  if (courseLesson) {
    return {
      course,
      lesson: decorateLesson(courseLesson, course, explicitMode),
    };
  }

  return {
    course: null,
    lesson: decorateLesson(findLessonById(lessonId), null, explicitMode),
  };
};

export const getConfirmationModeForLesson = (lessonId, options = {}) => {
  const explicitMode = normalizeConfirmationMode(options.confirmationMode);
  if (explicitMode) {
    return explicitMode;
  }

  const { lesson, course } = resolveLessonContext(lessonId, options);
  return (
    lesson?.confirmationMode ||
    course?.confirmationMode ||
    CONFIRMATION_MODES.PERSONALIZED
  );
};

export const requiresLessonConfirmation = (lessonId, options = {}) =>
  getConfirmationModeForLesson(lessonId, options) !== CONFIRMATION_MODES.NONE;

export const requiresIntakeForm = (lessonId, options = {}) =>
  getConfirmationModeForLesson(lessonId, options) ===
  CONFIRMATION_MODES.PERSONALIZED;

export const buildLessonPath = ({ lessonId, search = "" }) =>
  `/lessons/${lessonId}${normalizeSearch(search)}`;

export const buildLessonConfirmationPath = ({
  lessonId,
  courseNum,
  search = "",
}) => {
  const normalizedSearch = normalizeSearch(search);
  if (courseNum != null && courseNum !== "") {
    return `/courses/${courseNum}/lessons/${lessonId}/confirm${normalizedSearch}`;
  }
  return `/lessons/${lessonId}/confirm${normalizedSearch}`;
};

export const buildIntakePath = ({
  courseId,
  lessonId,
  courseNum,
  search = "",
}) => {
  const normalizedSearch = normalizeSearch(search);
  const token = new URLSearchParams(normalizedSearch).get("token");
  const intakeCourseId = courseId ?? courseNum ?? "";
  let intakePath = `/intake/${encodeURIComponent(intakeCourseId)}`;

  if (lessonId) {
    const returnTo = buildLessonConfirmationPath({ lessonId, courseNum, search });
    const params = new URLSearchParams();
    params.set("returnTo", returnTo);
    if (token) {
      params.set("token", token);
    }
    intakePath += `?${params.toString()}`;
  } else if (normalizedSearch) {
    intakePath += normalizedSearch;
  }

  return intakePath;
};

export const buildLessonLaunchPath = ({
  lessonId,
  courseNum,
  search = "",
}) => {
  const mode = getConfirmationModeForLesson(lessonId, { courseNum });
  if (mode === CONFIRMATION_MODES.NONE) {
    return buildLessonPath({ lessonId, search });
  }
  return buildLessonConfirmationPath({ lessonId, courseNum, search });
};
