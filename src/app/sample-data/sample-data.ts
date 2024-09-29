export const sample_processed_output = [
  {
    "id": "1",
    "output": {
      "formatted_response": {
        "response_type": "chart",
        "content": {
          "chart_type": "line",
          "data": [
            { "x": "03/08/2024", "y": 19985.56 },
            { "x": "22/06/2024", "y": -88.51 },
            { "x": "18/05/2024", "y": 14113.87 },
            { "x": "13/07/2024", "y": -89.52 },
            { "x": "10/08/2024", "y": 19985.56 },
            { "x": "06/07/2024", "y": -89.52 }
          ],
          "x_label": "Date",
          "y_label": "Fund Balance"
        }
      },
      "raw_response": "The date vs fund balance data is as follows:\n- 03/08/2024: 19985.560\n- 22/06/2024: -88.510\n- 18/05/2024: 14113.870\n- 13/07/2024: -89.520\n- 10/08/2024: 19985.560\n- 06/07/2024: -89.520",
      "confidence": 1,
      "follow_up_questions": [
        "Would you like to see the data for different dates?",
        "Do you need the fund balance data in a different format?",
        "Is there any other information you need regarding your stock broker?"
      ]
    }
  },
  {
    "id": "2",
    "output": {
      "formatted_response": {
        "response_type": "text",
        "content": {
          "text": "The maximum fund balance reported was 19985.560 on both 03/08/2024 and 10/08/2024."
        }
      },
      "raw_response": "The maximum fund balance reported was 19985.560 on both 03/08/2024 and 10/08/2024.",
      "confidence": 1,
      "follow_up_questions": [
        "Would you like details on the minimum fund balance?",
        "Do you need information on the securities balance?"
      ]
    }
  },
  {
    "id": 3,
    "output": {
      "formatted_response": {
        "response_type": "single_value",
        "content": {
          "value": 19985.56,
          "unit": "unit"
        }
      },
      "raw_response": "The minimum fund balance is 19985.56 units.",
      "confidence": 1,
      "follow_up_questions": [
        "Would you like to know the maximum fund balance?",
        "Do you need details on the dates for each fund balance?",
        "Shall I provide a summary of all fund balances?"
      ]
    }
  }
];