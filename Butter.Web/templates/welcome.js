<div class="empty welcome">
    <div class="empty-icon">
        <i class="icon icon-3x icon-edit"></i>
    </div>
    <p class="empty-title h5">Search for a schema</p>
    <p class="empty-subtitle">Enter the name of a service to get started.</p>
    
    <div class="container">
     <div class="columns">
        <div class="column">
            <div class="form-autocomplete">
                <div class="form-autocomplete-input form-input">
                    <input class="form-input" type="text" placeholder="Start typing here" id="searchBox">
                </div>
                <ul class="menu" id="searchBoxSuggestions"></ul>    
            </div>
        </div>
     </div>
     <div class="columns">
        <div class="column">
            <div id="versionSelector"></div>
        </div>
     </div>
     <div class="columns">
        <div class="column">
            <div id="resourceSelector"></div>
        </div>
     </div>
     <div class="columns">
        <div class="column">
            <button class="btn btn-success btn-block" id="getContentButton">Load schema</button>
        </div>
     </div>
     <div class="columns">
        <div class="column">
            <div class="form-group">
            <label class="form-switch text-left">
                <input type="checkbox" id="optionalFieldsToggle">
                <i class="form-icon"></i> Enable optional fields
            </label>
            <label class="form-switch text-left">
                <input type="checkbox" id="fullTemplateSchemaToggle">
                <i class="form-icon"></i> Enable full schema
            </label>
            </div>
        </div>
     </div>
    </div>
</div>
</div>

