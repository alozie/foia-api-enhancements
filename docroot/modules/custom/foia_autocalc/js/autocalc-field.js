(function ($, drupalSettings, Drupal) {
  Drupal.behaviors.autocalcFields = {
    attach: function attach() {
      var autocalcSettings = drupalSettings.foiaAutocalc.autocalcSettings;
      Object.keys(autocalcSettings).forEach(function(fieldName, fieldIndex) {
        var fieldSettings = autocalcSettings[fieldName];

        // Calculate field on initial form load only.
        var fieldCalculationsInitialized = fieldSettings['fieldCalculationsInitialized'] || false;
        if (!fieldCalculationsInitialized) {
          calculateAllFieldsWithName(fieldName, fieldSettings);
          fieldSettings['fieldCalculationsInitialized'] = true;
        }

        fieldSettings.forEach(function(fieldSetting) {
          var fieldSelector = convertToFieldSelector(fieldSetting);
          $(fieldSelector + ' input').each(function(index) {
            // Bind event listeners to calculate field when input fields are changed.
            $(this).once(fieldSelector + '_' + fieldIndex + '_' + index).on('change', function() {
              calculateAllFieldsWithName(fieldName, fieldSettings);
            });
          });
        });
      });
    }
  };

  /**
   * Calculates the value of all configured autocalc fields with a given field name.
   *
   * @param {string} fieldName
   *   The name of a field or fields to be autocalculated.
   * @param {array} fieldSettings
   *   Settings for all paragraph component or fields that contain an autocalculated field with the given fieldName.
   */
  function calculateAllFieldsWithName(fieldName, fieldSettings) {
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

  /**
   * Helper function to conver fieldSetting objects to selector strings.
   *
   * fieldSetting object structure is based on the structure of the field objects used to calculate field values.
   * For example, drupalSettings.foiaAutocalc.autocalcSettings['field_total'][0].
   *
   * @param {object} fieldSetting
   *   An object containing field and subfield that should be converted to a selector string.
   *   {
   *     field: 'field_name',
   *     subfield: {
   *       field: 'field_subfield'
   *     },
   *     this_entity: 1
   *   }
   *
   * @returns {string}
   *   A dom selector string.
   */
  function convertToFieldSelector(fieldSetting) {
    var selector = '.field--name-' + fieldSetting.field.replace(/_/g, '-');
    if (fieldSetting.hasOwnProperty('subfield')) {
      selector += ' ' + convertToFieldSelector(fieldSetting.subfield);
    }
    return selector;
  }

  /**
   * Helper function to check if a value is numeric.
   *
   * @param value
   *   The value to check.
   *
   * @returns {boolean}
   */
  function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

})(jQuery, drupalSettings, Drupal);
