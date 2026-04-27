import React, { useContext, useEffect, useMemo, useState } from "react";
import { Box, CircularProgress } from "@material-ui/core";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import LessonConfirmation from "./LessonConfirmation";
import {
  ThemeContext,
  USER_ID_STORAGE_KEY,
} from "../../config/config.js";
import parseJwt from "../../util/parseJWT";
import {
  CONFIRMATION_MODES,
  buildIntakePath,
  buildLessonPath,
  getConfirmationModeForLesson,
} from "../../util/lessonFlow.js";

const decodeTokenSafely = (token) => {
  if (!token) return null;
  try {
    return parseJwt(token);
  } catch (error) {
    console.warn("Failed to decode JWT:", error);
    return null;
  }
};

export default function LessonConfirmationGate(props) {
  const history = useHistory();
  const location = useLocation();
  const { lessonID, courseNum } = useParams();
  const theme = useContext(ThemeContext);
  const [ready, setReady] = useState(false);

  const token = theme?.jwt || new URLSearchParams(location.search).get("token");
  const decodedUser = theme?.user?.course_name ? theme.user : decodeTokenSafely(token);
  const courseName = decodedUser?.course_name || "";
  const explicitConfirmationMode = decodedUser?.confirmationMode || "";
  const confirmationMode = useMemo(
    () =>
      getConfirmationModeForLesson(lessonID, {
        courseNum,
        courseName,
        confirmationMode: explicitConfirmationMode,
      }),
    [lessonID, courseNum, courseName, explicitConfirmationMode]
  );

  useEffect(() => {
    let cancelled = false;

    const routeLearner = async () => {
      const firebase = theme?.firebase;
      const userId =
        firebase?.ltiContext?.user_id ||
        window?.appFirebase?.oats_user_id ||
        localStorage.getItem(USER_ID_STORAGE_KEY);

      // Step 1: Check if the QueryForm has been submitted.
      // If not, redirect to the query form with returnTo pointing back here so
      // the rest of this flow runs after the student completes or skips it.
      let hasQuery = false;
      if (userId && firebase?.db) {
        try {
          const queryRef = doc(
            firebase.db,
            "users",
            userId,
            "surveys",
            "initialQueryForm"
          );
          const querySnap = await getDoc(queryRef);
          hasQuery = querySnap.exists() && querySnap.data()?.completed === true;
        } catch (error) {
          console.error("Error checking query form in Firebase:", error);
        }
      }
      if (!hasQuery && userId) {
        hasQuery = !!localStorage.getItem(`query:${userId}:fallback`);
      }

      if (!hasQuery) {
        const params = new URLSearchParams();
        params.set("returnTo", `${location.pathname}${location.search}`);
        if (token) params.set("token", token);
        history.replace(`/query/5point?${params.toString()}`);
        return;
      }

      // Step 2: Route based on confirmationMode.
      if (confirmationMode === CONFIRMATION_MODES.NONE) {
        history.replace(buildLessonPath({ lessonId: lessonID, search: location.search }));
        return;
      }

      if (confirmationMode === CONFIRMATION_MODES.GENERIC) {
        if (!cancelled) setReady(true);
        return;
      }

      // Step 3 (personalized only): Check IntakeForm before showing confirmation.
      const courseId = decodedUser?.course_id || courseNum;

      let hasIntake = false;

      if (userId && courseId && firebase?.db) {
        try {
          const intakeRef = doc(
            firebase.db,
            "users",
            userId,
            "surveys",
            `intakeForm_course_${courseId}`
          );
          const intakeSnap = await getDoc(intakeRef);
          hasIntake =
            intakeSnap.exists() && intakeSnap.data()?.completed === true;
        } catch (error) {
          console.error("Error checking intake form in Firebase:", error);
        }
      }

      if (!hasIntake && userId && courseId) {
        hasIntake = !!localStorage.getItem(`intake:${userId}:course:${courseId}`);
      }

      if (!hasIntake) {
        history.replace(
          buildIntakePath({
            courseId,
            lessonId: lessonID,
            courseNum,
            search: location.search,
          })
        );
        return;
      }

      if (!cancelled) setReady(true);
    };

    setReady(false);
    routeLearner();

    return () => {
      cancelled = true;
    };
  }, [
    confirmationMode,
    courseNum,
    decodedUser?.course_id,
    history,
    lessonID,
    location.pathname,
    location.search,
    theme,
    token,
  ]);

  if (!ready) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  return <LessonConfirmation {...props} />;
}
