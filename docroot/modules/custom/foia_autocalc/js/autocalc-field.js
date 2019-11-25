(function ($, drupalSettings, Drupal) {
  Drupal.behaviors.autocalcFields = {
    attach: function attach() {
      var autocalcSettings = drupalSettings.foiaAutocalc.autocalcSettings;
      console.log('checks autocalc settings.');
      if (isDefined(autocalcSettings)) {
        Object.keys(autocalcSettings).forEach(function(fieldName, fieldIndex) {
          var fieldSettings = autocalcSettings[fieldName];
          console.log('checks for field settings for: ' + fieldName + '-' + fieldIndex);
          if (isDefined(fieldSettings)) {
            fieldSettings.forEach(function(fieldSetting) {
              var fieldSelector = convertToFieldSelector(fieldSetting);
              console.log('checks for field selector');
              if (isDefined(fieldSelector)) {
                $(fieldSelector + ' input').each(function(index) {
                    // Calculate field on initial form load.
                    console.log('calculates field value on initial load.');
                    var calcFieldSelector = convertToFieldSelector(fieldName + ' input');
                    var fieldInput = $(calcFieldSelector);
                    console.log('check whether field has input value.');
                    if(isDefined(fieldInput)) {
                      var fieldInputValue = fieldInput.val();
                    }
                    if (!fieldInputValue) {
                      console.log('field is empty so autocalculate a value.');
                      $(fieldSelector + ' input').each(function(index) {
                        calculateField(fieldName, fieldSettings);
                      });
                    }
                    // Bind event listeners to calculate field when input fields are changed.
                    $(this).once(fieldSelector + '_' + fieldIndex + '_' + index).on('change', function() {
                        calculateField(fieldName, fieldSettings);
                    });
                });
              }
            });
          }
        });
      }
    }
  };

  // Determine whether variable is defined.
  function isDefined(value) {
    return (typeof(value) !== 'undefined');
  }

  // Determines the value of the automatically calculated field.
  function calculateField(fieldName, fieldSettings) {
    var totalValues = {};
    var idSelector = '';
    var isTotalNA = true;

    fieldSettings.forEach(function (fieldSetting) {
      $(convertToFieldSelector(fieldSetting) + ' input').each(function() {
        var value = $(this).val();
        var selectedValue = 0;
        if (String(value).toLowerCase() === "n/a") {
          var selectedValue = null;
        }
        else {
          isTotalNA = false;
          if ( isNumeric(value) ) {
            selectedValue = Number($(this).val());
          }
        }

        // Get the selector for this field.
        if (fieldSetting.hasOwnProperty('this_entity') && fieldSetting.this_entity) {
          var index = $(this).attr('name').match(/\[(.*?)\]/)[1];
          idSelector = 'edit-' + fieldSetting.field.replace(/_/g, '-') + '-' + index;
        }
        else {
          idSelector = 'all';
        }

        // Add value to the selector.
        if (totalValues.hasOwnProperty(idSelector)) {
          if(selectedValue !== null) {
            totalValues[idSelector] += selectedValue;
          }
        }
        else {
          totalValues[idSelector] = selectedValue;
        }
      });
    });

    Object.keys(totalValues).forEach(function (selector) {
      // Set overall value to "N/A" if all fields are "N/A".
      if(isTotalNA) {
        totalValues[selector] = "N/A";
      }
      if (selector == 'all') {
        $(convertToFieldSelector({ field: fieldName }) + ' input').val(totalValues[selector]).trigger('change');
      }
      else {
        $('div[data-drupal-selector="' + selector + '"] ' + convertToFieldSelector({ field: fieldName }) + ' input').val(totalValues[selector]).trigger('change');
      }
    });
  }

  // Converts field autocalc settings to a jQuery selector.
  function convertToFieldSelector(fieldSetting) {
    if (isDefined(fieldSetting.field)) {
        var selector = '.field--name-' + fieldSetting.field.replace(/_/g, '-');
        if (fieldSetting.hasOwnProperty('subfield')) {
            selector += ' ' + convertToFieldSelector(fieldSetting.subfield);
        }
        return selector;
    }
    else {
      return false;
    }
  }

  function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

})(jQuery, drupalSettings, Drupal);
