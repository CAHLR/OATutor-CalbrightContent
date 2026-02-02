import React, { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
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

import BrandLogoNav from "@components/BrandLogoNav";
import Popup from "@components/Popup/Popup";
import About from "../../pages/Posts/About";
import {
  SHOW_COPYRIGHT,
  SITE_NAME,
  USER_ID_STORAGE_KEY,
  coursePlans,
} from "../../config/config.js";
import { useContext } from "react";
import { ThemeContext } from "../../config/config.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
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
    paddingTop: theme.spacing(10), // Add padding to account for fixed AppBar
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

// First page statements (default questions)
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

// Second page statements (different questions)
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

const PAGE1_INTRO = "The following statements are about your goals for this course. There is no right or wrong answer! Please indicate your level of agreement or disagreement with each item by choosing an option from the list below."
const PAGE2_INTRO = "This survey asks about your study habits, learning skills, and motivation for work in this course. There are no right or wrong answers to this questionnaire. This is not a test! We want you to respond as accurately as possible, reflecting your own attitudes and behaviors. Please rate each statement based on how true it is of you."

// 5-point scale labels (with line breaks for wrapping)
const SCALE_5_POINT = [
  "Strongly disagree",
  "Disagree",
  "Neither disagree nor agree",
  "Agree",
  "Strong agree",
];

// 7-point scale labels (with line breaks for wrapping)
const SCALE_7_POINT = [
  "Very untrue of me",
  "Untrue of me",
  "Somewhat untrue of me",
  "Neutral",
  "Somewhat true of me",
  "True of me",
  "Very true of me",
];

export default function QueryForm({ scaleType = 5, statements, title = "Learning Preferences Form", introText = "", page = 1 }) {
  const theme = useContext(ThemeContext)
  const firebase = theme?.firebase;
  const classes = useStyles();
  const history = useHistory();
  const { courseNum } = useParams();

  const [showPopup, setShowPopup] = useState(false);
  const [page1Responses, setPage1Responses] = useState({});
  const [page2Responses, setPage2Responses] = useState({});
  const [currentPage, setCurrentPage] = useState(page);

  const isFirstPage = currentPage === 1;

  // Determine which statements to use based on current page
  const currentStatements = isFirstPage ? PAGE1_STATEMENTS : PAGE2_STATEMENTS;
  const currentResponses = isFirstPage ? page1Responses : page2Responses;
  const setCurrentResponses = isFirstPage ? setPage1Responses : setPage2Responses;

  // Different intros for each page
  const intro = isFirstPage ? PAGE1_INTRO : PAGE2_INTRO;

  // Use 5-point scale for page 1, 7-point scale for page 2
  
  const scaleLabels = isFirstPage ? SCALE_5_POINT : SCALE_7_POINT;
  const scaleValues = isFirstPage ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7];

  // Calculate column widths for even distribution
  const numScaleColumns = scaleLabels.length;
  const statementColumnWidth = 25; // Percentage for statement column
  const scaleColumnWidth = (100 - statementColumnWidth) / numScaleColumns; // Evenly divide remaining space

  // Check if all statements have been answered
  const allAnswered = currentStatements.every((_, index) => currentResponses[`q${index + 1}`] !== undefined);

  const handleChange = (questionKey, value) => {
    setCurrentResponses((prev) => ({
      ...prev,
      [questionKey]: parseInt(value, 10),
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!allAnswered) return;
    
    // Save page 1 responses and move to page 2
    if (currentPage === 1) {
      setCurrentPage(2);
      // Scroll to top of page
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentPage(1);
    // Scroll to top of page
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    console.log("firebase.db:", firebase.db);
    console.log("lms_user_id:", firebase.lms_user_id, "oats_user_id:", firebase.oats_user_id);
    console.log("handleSubmit");
    e.preventDefault();
    if (!allAnswered) return;
    console.log("allAnswered");
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || theme?.jwt;
    
    try {
      if (firebase && firebase.db) {
        console.log("firebase");
        // const userId = firebase.ltiContext?.user_id || firebase.oats_user_id;
        // console.log("userId: ", userId)

        // if (!userId) {
        //   console.log("no ID")
        //   throw new Error("User ID not available");
        // }

        const surveyData = {
            completed: true,
            page1: page1Responses,
            page2: page2Responses
        };

        console.log("surveyData:", surveyData)

        console.log("Calling firebase.submitSurvey...");
        await firebase.submitSurvey(surveyData);
        console.log("Survey submission completed");

        // submission saved; next-step routing handled after try/catch
      } else {
          console.warn("Firebase not available, fallback to localStorage");
          const userId =
              (window?.appFirebase?.oats_user_id) ||
              localStorage.getItem(USER_ID_STORAGE_KEY);

          localStorage.setItem(
              `query:${userId}:fallback`,
              JSON.stringify({
                  page1: page1Responses,
                  page2: page2Responses,
                  ts: Date.now()
              })
          );
          // submission saved locally; next-step routing handled after try/catch
      }
    } catch (err) {
        console.error("Failed to save survey:", err);
    }
    // After submission, determine next step: only two options
    // 1. If IntakeForm not submitted → redirect to IntakeForm
    // 2. If IntakeForm already submitted → redirect to Lesson Confirmation
    try {
      const returnTo = new URLSearchParams(window.location.search).get('returnTo');
      console.log("QueryForm returnTo:", returnTo);
      
      // Determine courseIndex and lessonId
      let courseIndex = null;
      let lessonId = null;
      
      // PRIMARY SOURCE: Get linkedLesson from JWT token (most reliable)
      // This is set in index.js and should always be available
      if (firebase?.ltiContext?.linkedLesson) {
        lessonId = firebase.ltiContext.linkedLesson;
        console.log("QueryForm: Got lessonId from JWT token (linkedLesson):", lessonId);
        
        // Find courseIndex using the same logic as index.js
        for (let i = 0; i < coursePlans.length; i++) {
          const course = coursePlans[i];
          if (course.lessons && course.lessons.some(lesson => lesson.id === lessonId)) {
            courseIndex = i;
            console.log("QueryForm: Found courseIndex from linkedLesson:", courseIndex);
            break;
          }
        }
      }
      
      // FALLBACK 1: Try to extract lesson ID from returnTo if not found in JWT
      if (!lessonId && returnTo) {
        // Decode the returnTo in case it's URL-encoded
        const decodedReturnTo = decodeURIComponent(returnTo);
        console.log("QueryForm decodedReturnTo:", decodedReturnTo);
        
        // Extract lesson ID - handle both /lessons/ID/confirm and #/lessons/ID/confirm patterns
        // Try hash pattern first (#/lessons/ID), then regular pattern (/lessons/ID)
        let lessonMatch = decodedReturnTo.match(/#\/lessons\/([^\/\?]+)/);
        if (!lessonMatch) {
          lessonMatch = decodedReturnTo.match(/\/lessons\/([^\/\?]+)/);
        }
        if (lessonMatch) {
          lessonId = lessonMatch[1];
          console.log("QueryForm extracted lessonId from returnTo:", lessonId);
          if (courseIndex === null) {
            const course = coursePlans.find(c => c.lessons?.some(l => l.id === lessonId));
            if (course) {
              courseIndex = coursePlans.indexOf(course);
              console.log("QueryForm found courseIndex from returnTo:", courseIndex);
            } else {
              console.warn("QueryForm: Could not find course for lessonId:", lessonId);
            }
          }
        } else {
          console.warn("QueryForm: Could not extract lessonId from returnTo:", decodedReturnTo);
        }
      }
      
      // FALLBACK 2: If we don't have courseIndex yet, try to get it from courseNum
      if (courseIndex === null && courseNum) {
        courseIndex = parseInt(courseNum, 10);
        console.log("QueryForm: Using courseNum for courseIndex:", courseIndex);
        if (courseIndex !== null && !lessonId) {
          lessonId = coursePlans?.[courseIndex]?.lessons?.[0]?.id;
          console.log("QueryForm: Extracted lessonId from courseIndex:", lessonId);
        }
      }
      
      // FALLBACK 3: If we still don't have courseIndex, try harder to find it or use fallback
      // NEVER use history.goBack() in LTI context as it sends users back to Canvas
      if (courseIndex === null) {
        console.error("QueryForm: Could not determine courseIndex. returnTo:", returnTo, "courseNum:", courseNum, "lessonId:", lessonId, "ltiContext.linkedLesson:", firebase?.ltiContext?.linkedLesson);
        
        // If we have lessonId, try a more thorough search for the course
        if (lessonId) {
          console.log("QueryForm: Attempting thorough course search for lessonId:", lessonId);
          for (let i = 0; i < coursePlans.length; i++) {
            const course = coursePlans[i];
            if (course.lessons) {
              const foundLesson = course.lessons.find(l => l.id === lessonId);
              if (foundLesson) {
                courseIndex = i;
                console.log("QueryForm: Found courseIndex through thorough search:", courseIndex);
                break;
              }
            }
          }
        }
        
        // If we still don't have courseIndex but have returnTo, extract path and redirect
        // This ensures we stay within the app and don't go back to Canvas
        if (courseIndex === null && returnTo) {
          const decodedReturnTo = decodeURIComponent(returnTo);
          // Extract just the path part after the hash if it's a full URL
          const hashMatch = decodedReturnTo.match(/#(.+)$/);
          const pathToUse = hashMatch ? hashMatch[1] : decodedReturnTo;
          console.log("QueryForm: No courseIndex found, redirecting to returnTo path:", pathToUse);
          
          // Extract token for the redirect
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token') || theme?.jwt;
          const search = token ? `?token=${token}` : "";
          
          // If pathToUse already has query params, append token; otherwise add it
          const finalPath = pathToUse.includes('?') 
            ? `${pathToUse}&token=${token || ''}` 
            : `${pathToUse}${search}`;
          
          history.push(finalPath);
          return;
        }
        
        // Last resort: if we have lessonId, try to redirect to lesson confirmation directly
        // This is safer than going back to Canvas
        if (lessonId) {
          const search = token ? `?token=${token}` : "";
          console.log("QueryForm: Last resort - redirecting to lesson confirmation with lessonId:", lessonId);
          history.push(`/lessons/${lessonId}/confirm${search}`);
          return;
        }
        
        // Absolute last resort: redirect to a safe page (query form again with error handling)
        // This should never happen if middleware is working correctly
        console.error("QueryForm: CRITICAL - No courseIndex, returnTo, or lessonId. This should not happen.");
        const search = token ? `?token=${token}` : "";
        // Redirect back to query form - better than going to Canvas
        history.push(`/query/5point${search}`);
        return;
      }
      
      // Check if IntakeForm has been submitted
      let hasIntake = false;
      const userId = firebase?.ltiContext?.user_id || (window?.appFirebase?.oats_user_id) || localStorage.getItem(USER_ID_STORAGE_KEY);
      
      // Get course code from JWT
      let courseId = null;
      if (token) {
        const decoded = decodeJWT(token);
        courseId = decoded?.course_id || null;
      }
      if (!courseId) {
        console.error("QueryForm: Missing course_id in token; cannot route to IntakeForm reliably.");
      }
      
      if (userId) {
        // Check Firebase first
        if (firebase && firebase.db) {
          try {
            const intakeRef = doc(firebase.db, "users", userId, "surveys", `intakeForm_course_${courseId}`);
            const intakeSnap = await getDoc(intakeRef);
            hasIntake = intakeSnap.exists() && intakeSnap.data().completed === true;
          } catch (err) {
            console.error("Error checking intakeform in Firebase:", err);
          }
        }
        
        // Also check localStorage as fallback
        if (!hasIntake) {
          const intakeKey = `intake:${userId}:course:${courseId}`;
          hasIntake = !!localStorage.getItem(intakeKey);
        }
      }
      
      // Prepare search params for redirects (extract token, excluding returnTo)
      const search = token ? `?token=${token}` : "";
      
      // Two possible redirects:
      if (!hasIntake) {
        // Option 1: IntakeForm not submitted → redirect to IntakeForm
        const confirmUrl = lessonId ? `/lessons/${lessonId}/confirm${search}` : null;
        let intakeFormUrl = `/intake/${encodeURIComponent(courseId)}`;
        if (confirmUrl) {
          intakeFormUrl += `?returnTo=${encodeURIComponent(confirmUrl)}`;
          if (token) {
            intakeFormUrl += `&token=${token}`;
          }
        } else if (search) {
          intakeFormUrl += search;
        }
        history.push(intakeFormUrl);
      } else {
        // Option 2: IntakeForm already submitted → redirect to Lesson Confirmation
        if (lessonId) {
          history.push(`/lessons/${lessonId}/confirm${search}`);
        } else {
          // Fallback if we don't have lessonId
          history.push(`/courses/${courseIndex}${search}`);
        }
      }
    } catch (err) {
      console.error("Error in QueryForm redirect logic:", err);
      // NEVER use history.goBack() in LTI context - it sends users back to Canvas
      // Try to extract returnTo and redirect there, or redirect to a safe page
      try {
        const returnTo = new URLSearchParams(window.location.search).get('returnTo');
        if (returnTo) {
          const decodedReturnTo = decodeURIComponent(returnTo);
          const hashMatch = decodedReturnTo.match(/#(.+)$/);
          const pathToUse = hashMatch ? hashMatch[1] : decodedReturnTo;
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token') || theme?.jwt;
          const search = token ? `?token=${token}` : "";
          const finalPath = pathToUse.includes('?') 
            ? `${pathToUse}&token=${token || ''}` 
            : `${pathToUse}${search}`;
          history.push(finalPath);
        } else {
          // Last resort: redirect to query form again
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token') || theme?.jwt;
          const search = token ? `?token=${token}` : "";
          history.push(`/query/5point${search}`);
        }
      } catch (fallbackErr) {
        console.error("Error in fallback redirect:", fallbackErr);
        // Absolute last resort - redirect to root with token if available
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token') || theme?.jwt;
        const search = token ? `?token=${token}` : "";
        history.push(`/${search}`);
      }
    }
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
        {/* Title and Intro in separate box */}
        <Paper className={classes.titleCard} elevation={3}>
          <Box className={classes.sectionTitle}>
            <Typography variant="h5" style={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body1" color="textSecondary" className={classes.sectionIntro}>
              {intro}
            </Typography>
          </Box>
        </Paper>

        {/* Form table in separate box */}
        <Paper className={classes.formCard} elevation={3} component="form" onSubmit={isFirstPage ? handleNext : handleSubmit}>
          <TableContainer className={classes.tableContainer}>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  <TableCell className={classes.statementCell} style={{ width: `${statementColumnWidth}%` }}>
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
                      <TableCell className={classes.statementCell} style={{ width: `${statementColumnWidth}%` }}>
                        <Typography variant="body2">
                          {statement}
                        </Typography>
                      </TableCell>
                      {scaleValues.map((value) => (
                        <TableCell key={value} className={classes.radioCell} style={{ width: `${scaleColumnWidth}%` }}>
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
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleBack}
                  style={{ marginRight: 16 }}
                >
                  Back
                </Button>
              </>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!allAnswered}
            >
              {isFirstPage ? "Next" : "Submit"}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Box className={classes.footer}>
        <Box component="span">
          {SHOW_COPYRIGHT && `© ${new Date().getFullYear()} ${SITE_NAME}`}
        </Box>
        <Box className={classes.spacer} />
        <IconButton onClick={() => setShowPopup(true)} title={`About ${SITE_NAME}`}>
          <HelpOutlineOutlinedIcon />
        </IconButton>
      </Box>

      <Popup isOpen={showPopup} onClose={() => setShowPopup(false)}>
        <About />
      </Popup>
    </Box>
  );
}

// Export separate components for 5-point and 7-point scales for convenience
export function QueryForm5Point(props) {
  return <QueryForm scaleType={5} page={1} {...props} />;
}

export function QueryForm7Point(props) {
  return <QueryForm scaleType={7} {...props} />;
}