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
} from "../../config/config.js";

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
  "I am striving to understand the content of this course as thoroughly as possible.",
  "My goal is to learn as much as possible.",
  "My aim is to avoid learning less than I possibly could.",
  "I am striving to avoid an incomplete understanding of the course material.",
  "My goal is to avoid learning less than it is possible to learn.",
  "My aim is to perform well relative to other students.",
  "I am striving to do well compared to other students.",
  "My goal is to perform better than the other students.",
  "My aim is to avoid doing worse than other students.",
  "I am striving to avoid performing worse than others.",
  "My goal is to avoid performing poorly compared to others.",
];

// Second page statements (different questions)
const PAGE2_STATEMENTS = [
  "I prefer learning in a structured environment with clear guidelines.",
  "I enjoy exploring topics on my own without strict boundaries.",
  "I learn best when I can see practical applications of the material.",
  "I prefer theoretical concepts over hands-on practice.",
  "I work better when I have deadlines to meet.",
  "I prefer flexible timelines that allow me to work at my own pace.",
  "I benefit most from visual aids like diagrams and charts.",
  "I learn better through listening and discussion.",
];

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

export default function QueryForm({ scaleType = 5, statements, title = "Learning Preferences Form", introText, page = 1 }) {
  const classes = useStyles();
  const history = useHistory();
  const { courseNum } = useParams();

  const [showPopup, setShowPopup] = useState(false);
  const [page1Responses, setPage1Responses] = useState({});
  const [page2Responses, setPage2Responses] = useState({});
  const [currentPage, setCurrentPage] = useState(page);

  // Determine which statements to use based on current page
  const currentStatements = statements || (currentPage === 1 ? PAGE1_STATEMENTS : PAGE2_STATEMENTS);
  const currentResponses = currentPage === 1 ? page1Responses : page2Responses;
  const setCurrentResponses = currentPage === 1 ? setPage1Responses : setPage2Responses;

  // Default intro text if not provided
  const defaultIntroText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  const intro = introText || defaultIntroText;

  const headerTitle = title;
  
  // Use 5-point scale for page 1, 7-point scale for page 2
  const isFirstPage = currentPage === 1;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allAnswered) return;
    
    try {
      // Prefer an app-exposed Firebase instance id, otherwise fall back to stored user id.
      const userId =
        (window?.appFirebase?.oats_user_id) ||
        localStorage.getItem(USER_ID_STORAGE_KEY);

      // Save both pages of responses
      const allResponses = {
        page1: page1Responses,
        page2: page2Responses,
        ts: Date.now()
      };

      const storageKey = `query:${userId}:course:${courseNum || 'default'}:scale:${scaleType}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify(allResponses)
      );
    } catch {}
    
    // After submission, navigate back
    if (courseNum) {
      history.push(`/courses/${courseNum}`);
    } else {
      history.push("/");
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