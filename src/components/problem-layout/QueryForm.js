import React, { useContext, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Container,
  Grid,
  IconButton,
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  makeStyles,
} from "@material-ui/core";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import { doc, getDoc } from "firebase/firestore";

import BrandLogoNav from "@components/BrandLogoNav";
import Popup from "@components/Popup/Popup";
import About from "../../pages/Posts/About";
import {
  SHOW_COPYRIGHT,
  SITE_NAME,
  USER_ID_STORAGE_KEY,
  coursePlans,
} from "../../config/config.js";
import { ThemeContext } from "../../config/config.js";
import {
  buildIntakePath,
  buildLessonConfirmationPath,
  buildLessonPath,
  CONFIRMATION_MODES,
  findCourseByName,
  getConfirmationModeForLesson,
} from "../../util/lessonFlow.js";

const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch (err) {
    console.warn("Failed to decode JWT:", err);
    return null;
  }
};

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  container: {
    flexGrow: 1,
    padding: theme.spacing(4, 0),
    paddingTop: theme.spacing(10),
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    alignItems: "center",
  },
  titleCard: {
    width: "100%",
    maxWidth: 1200,
    borderRadius: 16,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  formCard: {
    width: "100%",
    maxWidth: 1200,
    borderRadius: 16,
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
  },
  headerBar: {
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: theme.spacing(1),
  },
  sectionIntro: {
    textAlign: "center",
    marginTop: theme.spacing(1),
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 650,
    tableLayout: "fixed",
    width: "100%",
  },
  statementCell: {
    padding: theme.spacing(1.5),
    verticalAlign: "middle",
    whiteSpace: "normal",
    wordWrap: "break-word",
  },
  radioCell: {
    padding: theme.spacing(0.5),
    textAlign: "center",
    verticalAlign: "middle",
    width: "auto",
  },
  scaleHeader: {
    fontWeight: 600,
    textAlign: "center",
    padding: theme.spacing(1),
    fontSize: "0.75rem",
    whiteSpace: "normal",
    wordWrap: "break-word",
    lineHeight: 1.3,
    width: "auto",
  },
  rowEven: {
    backgroundColor: theme.palette.action.hover,
  },
  rowOdd: {
    backgroundColor: theme.palette.background.paper,
  },
  footer: {
    marginTop: "auto",
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
  },
  spacer: { flexGrow: 1 },
  nextButton: {
    marginTop: theme.spacing(2),
  },
}));

const PAGE1_STATEMENTS = [
  "My aim is to completely master the material presented in this class.",
  "I am striving to do well compared to other students.",
  "My goal is to learn as much as possible.",
  "My aim is to perform well relative to other students.",
  "My aim is to avoid learning less than I possibly could.",
  "My goal is to avoid performing poorly compared to others.",
  "I am striving to understand the content of this course as thoroughly as possible.",
  "My goal is to perform better than the other students.",
  "My goal is to avoid learning less than it is possible to learn.",
  "My aim is to avoid doing worse than other students.",
  "I am striving to avoid an incomplete understanding of the course material.",
  "I am striving to avoid performing worse than others.",
];

const PAGE2_STATEMENTS = [
  "In a class like this, I prefer course material that really challenges me so I can learn new things.",
  "If I study in appropriate ways, then I will be able to learn the material in this course.",
  "I think I will be able to use what I learn in this course in other courses.",
  "I believe I will receive an excellent grade in this class.",
  "I'm certain I can understand the most difficult material presented in the readings for this course.",
  "Getting a good grade in this class is the most satisfying thing for me right now.",
  "It is my own fault if I don't learn the material in this course.",
  "It is important for me to learn the course material in this class.",
  "The most important thing for me right now is improving my overall grade point average, so my main concern in this class is getting a good grade.",
  "I'm confident I can understand the basic concepts taught in this course.",
  "If I can, I want to get better grades in this class than most of the other students.",
  "I'm confident I can understand the most complex material presented by the instructor in this course.",
  "I am very interested in the content area of this course.",
  "If I try hard enough, then I will understand the course material.",
  "I'm confident I can do an excellent job on the assignments and tests in this course.",
  "I expect to do well in this class.",
  "The most satisfying thing for me in this course is trying to understand the content as thoroughly as possible.",
  "I think the course material in this class is useful for me to learn.",
  "When I have the opportunity in this class, I choose course assignments that I can learn from even if they don't guarantee a good grade.",
  "If I don't understand the course material, it is because I didn't try hard enough.",
  "I like the subject matter of this course.",
  "Understanding the subject matter of this course is very important to me.",
  "I'm certain I can master the skills being taught in this class.",
  "I want to do well in this class because it is important to show my ability to my family, friends, employer, or others.",
  "Considering the difficulty of this course, the teacher, and my skills, I think I will do well in this class.",
];

const PAGE1_INTRO =
  "The following statements are about your goals for this course. There is no right or wrong answer! Please indicate your level of agreement or disagreement with each item by choosing an option from the list below.";
const PAGE2_INTRO =
  "This survey asks about your study habits, learning skills, and motivation for work in this course. There are no right or wrong answers to this questionnaire. This is not a test! We want you to respond as accurately as possible, reflecting your own attitudes and behaviors. Please rate each statement based on how true it is of you.";

const SCALE_5_POINT = [
  "Strongly disagree",
  "Disagree",
  "Neither disagree nor agree",
  "Agree",
  "Strong agree",
];

const SCALE_7_POINT = [
  "Very untrue of me",
  "Untrue of me",
  "Somewhat untrue of me",
  "Neutral",
  "Somewhat true of me",
  "True of me",
  "Very true of me",
];

const extractAppPath = (returnTo) => {
  if (!returnTo) return "";
  const decodedReturnTo = decodeURIComponent(returnTo);
  const hashMatch = decodedReturnTo.match(/#(.+)$/);
  return hashMatch ? hashMatch[1] : decodedReturnTo;
};

const extractLessonIdFromPath = (path) => {
  if (!path) return null;
  const match = path.match(/\/lessons\/([^\/\?]+)/);
  return match ? match[1] : null;
};

const extractCourseNumFromPath = (path) => {
  if (!path) return null;
  const match = path.match(/\/courses\/([^\/\?]+)\/lessons\/[^\/\?]+\/confirm/);
  return match ? match[1] : null;
};

export default function QueryForm({
  scaleType = 5,
  statements,
  title = "Learning Preferences Form",
  introText = "",
  page = 1,
}) {
  const theme = useContext(ThemeContext);
  const firebase = theme?.firebase;
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const { courseNum } = useParams();

  const [showPopup, setShowPopup] = useState(false);
  const [page1Responses, setPage1Responses] = useState({});
  const [page2Responses, setPage2Responses] = useState({});
  const [currentPage, setCurrentPage] = useState(page);

  const isFirstPage = currentPage === 1;
  const currentStatements = isFirstPage ? PAGE1_STATEMENTS : PAGE2_STATEMENTS;
  const currentResponses = isFirstPage ? page1Responses : page2Responses;
  const setCurrentResponses = isFirstPage
    ? setPage1Responses
    : setPage2Responses;
  const intro = isFirstPage ? PAGE1_INTRO : PAGE2_INTRO;
  const scaleLabels = isFirstPage ? SCALE_5_POINT : SCALE_7_POINT;
  const scaleValues = isFirstPage ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7];
  const numScaleColumns = scaleLabels.length;
  const statementColumnWidth = 25;
  const scaleColumnWidth = (100 - statementColumnWidth) / numScaleColumns;
  const allAnswered = currentStatements.every(
    (_, index) => currentResponses[`q${index + 1}`] !== undefined
  );

  const handleChange = (questionKey, value) => {
    setCurrentResponses((prev) => ({
      ...prev,
      [questionKey]: parseInt(value, 10),
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!allAnswered) return;

    if (currentPage === 1) {
      setCurrentPage(2);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e, { skip = false } = {}) => {
    console.log("firebase.db:", firebase?.db);
    console.log(
      "lms_user_id:",
      firebase?.lms_user_id,
      "oats_user_id:",
      firebase?.oats_user_id
    );
    console.log("handleSubmit");

    if (e) {
      e.preventDefault();
    }
    if (!skip && !allAnswered) return;

    const buildSkippedResponses = (promptStatements) => {
      const responses = {};
      promptStatements.forEach((_, index) => {
        responses[`q${index + 1}`] = -1;
      });
      return responses;
    };

    const finalPage1Responses = skip
      ? buildSkippedResponses(PAGE1_STATEMENTS)
      : page1Responses;
    const finalPage2Responses = skip
      ? buildSkippedResponses(PAGE2_STATEMENTS)
      : page2Responses;

    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token") || theme?.jwt;

    try {
      if (firebase && firebase.db) {
        const surveyData = {
          completed: true,
          page1: finalPage1Responses,
          page2: finalPage2Responses,
          skipped: skip,
        };

        console.log("surveyData:", surveyData);
        await firebase.submitSurvey(surveyData);
      } else {
        console.warn("Firebase not available, fallback to localStorage");
        const userId =
          window?.appFirebase?.oats_user_id ||
          localStorage.getItem(USER_ID_STORAGE_KEY);

        localStorage.setItem(
          `query:${userId}:fallback`,
          JSON.stringify({
            page1: finalPage1Responses,
            page2: finalPage2Responses,
            ts: Date.now(),
          })
        );
      }
    } catch (err) {
      console.error("Failed to save survey:", err);
    }

    try {
      const returnTo = urlParams.get("returnTo");
      const returnToPath = extractAppPath(returnTo);

      let lessonId = firebase?.ltiContext?.linkedLesson || null;
      let routeCourseNum = extractCourseNumFromPath(returnToPath);

      if (!lessonId) {
        lessonId = extractLessonIdFromPath(returnToPath);
      }

      let courseIndex = null;
      if (routeCourseNum != null) {
        const parsedCourseNum = parseInt(routeCourseNum, 10);
        if (!Number.isNaN(parsedCourseNum)) {
          courseIndex = parsedCourseNum;
        }
      }

      if (courseIndex === null && courseNum != null) {
        const parsedCourseNum = parseInt(courseNum, 10);
        if (!Number.isNaN(parsedCourseNum)) {
          courseIndex = parsedCourseNum;
        }
      }

      let decodedToken = null;
      if (token) {
        decodedToken = decodeJWT(token);
      }

      let courseName = decodedToken?.course_name || theme?.user?.course_name || "";
      const explicitConfirmationMode = decodedToken?.confirmationMode || "";
      if (courseIndex === null && courseName) {
        const namedCourse = findCourseByName(courseName);
        if (namedCourse) {
          courseIndex = coursePlans.indexOf(namedCourse);
        }
      }

      if (courseIndex === null && lessonId) {
        const fallbackIndex = coursePlans.findIndex((course) =>
          course.lessons?.some((lesson) => lesson.id === lessonId)
        );
        if (fallbackIndex > -1) {
          courseIndex = fallbackIndex;
        }
      }

      if (!lessonId && courseIndex !== null) {
        lessonId = coursePlans?.[courseIndex]?.lessons?.[0]?.id || null;
      }

      if (!lessonId) {
        const fallbackSearch = token ? `?token=${token}` : "";
        history.push(`/courses/${courseIndex ?? 0}${fallbackSearch}`);
        return;
      }

      if (routeCourseNum == null && courseIndex !== null) {
        routeCourseNum = String(courseIndex);
      }

      const search = token ? `?token=${token}` : "";
      const confirmationMode = getConfirmationModeForLesson(lessonId, {
        courseNum: routeCourseNum,
        courseName,
        confirmationMode: explicitConfirmationMode,
      });

      if (confirmationMode === CONFIRMATION_MODES.NONE) {
        history.push(buildLessonPath({ lessonId, search }));
        return;
      }

      if (confirmationMode === CONFIRMATION_MODES.GENERIC) {
        history.push(
          buildLessonConfirmationPath({
            lessonId,
            courseNum: routeCourseNum,
            search,
          })
        );
        return;
      }

      const userId =
        firebase?.ltiContext?.user_id ||
        window?.appFirebase?.oats_user_id ||
        localStorage.getItem(USER_ID_STORAGE_KEY);
      const intakeLookupId = decodedToken?.course_id || String(courseIndex);

      let hasIntake = false;
      if (userId && intakeLookupId && firebase?.db) {
        try {
          const intakeRef = doc(
            firebase.db,
            "users",
            userId,
            "surveys",
            `intakeForm_course_${intakeLookupId}`
          );
          const intakeSnap = await getDoc(intakeRef);
          hasIntake =
            intakeSnap.exists() && intakeSnap.data().completed === true;
        } catch (err) {
          console.error("Error checking intake form in Firebase:", err);
        }
      }

      if (!hasIntake && userId && intakeLookupId) {
        hasIntake = !!localStorage.getItem(
          `intake:${userId}:course:${intakeLookupId}`
        );
      }

      if (!hasIntake) {
        history.push(
          buildIntakePath({
            courseId: intakeLookupId,
            lessonId,
            courseNum: routeCourseNum,
            search,
          })
        );
        return;
      }

      history.push(
        buildLessonConfirmationPath({
          lessonId,
          courseNum: routeCourseNum,
          search,
        })
      );
    } catch (err) {
      console.error("Error in QueryForm redirect logic:", err);
      try {
        const returnTo = new URLSearchParams(location.search).get("returnTo");
        if (returnTo) {
          const pathToUse = extractAppPath(returnTo);
          const urlParams = new URLSearchParams(location.search);
          const token = urlParams.get("token") || theme?.jwt;
          const search = token ? `?token=${token}` : "";
          const finalPath = pathToUse.includes("?")
            ? `${pathToUse}&token=${token || ""}`
            : `${pathToUse}${search}`;
          history.push(finalPath);
        } else {
          const urlParams = new URLSearchParams(location.search);
          const token = urlParams.get("token") || theme?.jwt;
          const search = token ? `?token=${token}` : "";
          history.push(`/query/5point${search}`);
        }
      } catch (fallbackErr) {
        console.error("Error in fallback redirect:", fallbackErr);
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get("token") || theme?.jwt;
        const search = token ? `?token=${token}` : "";
        history.push(`/${search}`);
      }
    }
  };

  const handleSkip = (e) => {
    if (e) {
      e.preventDefault();
    }
    handleSubmit(null, { skip: true });
  };

  return (
    <Box className={classes.root}>
      <AppBar position="fixed" className={classes.headerBar}>
        <Toolbar>
          <Grid container alignItems="center">
            <Grid item xs={3}>
              <BrandLogoNav />
            </Grid>
            <Grid item xs={6} />
            <Grid item xs={3} />
          </Grid>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" className={classes.container}>
        <Paper className={classes.titleCard} elevation={3}>
          <Box className={classes.sectionTitle}>
            <Typography variant="h5" style={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              className={classes.sectionIntro}
            >
              {intro}
            </Typography>
          </Box>
        </Paper>

        <Paper
          className={classes.formCard}
          elevation={3}
          component="form"
          onSubmit={isFirstPage ? handleNext : handleSubmit}
        >
          <TableContainer className={classes.tableContainer}>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    className={classes.statementCell}
                    style={{ width: `${statementColumnWidth}%` }}
                  >
                    <Typography variant="body2" style={{ fontWeight: 600 }}>
                      Statement
                    </Typography>
                  </TableCell>
                  {scaleLabels.map((label, index) => (
                    <TableCell key={index} className={classes.scaleHeader}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentStatements.map((statement, statementIndex) => {
                  const questionKey = `q${statementIndex + 1}`;
                  const selectedValue = currentResponses[questionKey];
                  const isEven = statementIndex % 2 === 0;

                  return (
                    <TableRow
                      key={statementIndex}
                      className={isEven ? classes.rowEven : classes.rowOdd}
                    >
                      <TableCell
                        className={classes.statementCell}
                        style={{ width: `${statementColumnWidth}%` }}
                      >
                        <Typography variant="body2">{statement}</Typography>
                      </TableCell>
                      {scaleValues.map((value) => (
                        <TableCell
                          key={value}
                          className={classes.radioCell}
                          style={{ width: `${scaleColumnWidth}%` }}
                        >
                          <Radio
                            checked={selectedValue === value}
                            onChange={() => handleChange(questionKey, value)}
                            value={value}
                            name={questionKey}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center" className={classes.nextButton}>
            {!isFirstPage && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleBack}
                style={{ marginRight: 16 }}
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!allAnswered}
            >
              {isFirstPage ? "Next" : "Submit"}
            </Button>
            <Button
              type="button"
              variant="text"
              color="default"
              onClick={handleSkip}
              style={{ marginLeft: 16 }}
            >
              Skip
            </Button>
          </Box>
        </Paper>
      </Container>

      <Box className={classes.footer}>
        <Box component="span">
          {SHOW_COPYRIGHT && `© ${new Date().getFullYear()} ${SITE_NAME}`}
        </Box>
        <Box className={classes.spacer} />
        <IconButton
          onClick={() => setShowPopup(true)}
          title={`About ${SITE_NAME}`}
        >
          <HelpOutlineOutlinedIcon />
        </IconButton>
      </Box>

      <Popup isOpen={showPopup} onClose={() => setShowPopup(false)}>
        <About />
      </Popup>
    </Box>
  );
}

export function QueryForm5Point(props) {
  return <QueryForm scaleType={5} page={1} {...props} />;
}

export function QueryForm7Point(props) {
  return <QueryForm scaleType={7} {...props} />;
}
